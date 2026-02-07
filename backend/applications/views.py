from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from django.shortcuts import get_object_or_404
from django.db import models as django_models
from .models import Application, Message
from shelters.models import Shelter, ShelterUser
from .serializers import (
    ApplicationSerializer,
    ApplicationDetailForOwnerSerializer,
    ApplicationDetailForShelterSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
    MessageSerializer
)


class ApplicationViewSet(viewsets.ModelViewSet):
    """応募管理 ViewSet"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # 1. 自分が応募者である応募
        # 検索性向上のため shelter_id も冗長保持されているので、そちらを活用するのがベターだが、
        # ここでは権限フィルタなのでロジック優先。
        queryset = Application.objects.filter(applicant=user)
        
        # 2. 保護団体ユーザーの場合、自団体の猫への応募も含める
        if user.user_type == 'shelter':
            # 所属している有効な団体のIDリストを取得
            shelter_ids = ShelterUser.objects.filter(
                user=user, 
                is_active=True
            ).values_list('shelter_id', flat=True)
            
            # Applicationモデルの冗長フィールド shelter_id を利用して高速化
            # (cat__shelter_id ではなく shelter_id を直接見る)
            queryset = queryset | Application.objects.filter(shelter_id__in=shelter_ids)
            
        return queryset.distinct().order_by('-applied_at')

    def get_serializer_class(self):
        # 1. 作成時
        if self.action == 'create':
            return ApplicationCreateSerializer
            
        # 2. ステータス更新時 (アクション)
        if self.action == 'update_status':
            return ApplicationStatusUpdateSerializer
            
        # 3. 詳細表示時 (retrieve)
        if self.action == 'retrieve':
            instance = self.get_object()
            user = self.request.user
            
            # アクセス者が保護団体メンバーかどうか判定
            is_shelter_member = False
            if user.user_type == 'shelter':
                is_shelter_member = ShelterUser.objects.filter(
                    user=user,
                    shelter_id=instance.shelter_id, # 冗長フィールドを活用
                    is_active=True
                ).exists()
            
            if is_shelter_member:
                # 保護団体用（連絡先開示版）
                return ApplicationDetailForShelterSerializer
            elif instance.applicant == user:
                return ApplicationDetailForOwnerSerializer
        
        # 4. その他
        # get_queryset() で関係者以外はフィルタリングされるため、
        # 実際にはここには到達せず 404 Not Found となるが、
        # 仕様を明確にするため明示的に 404 をraiseするのも良い。
        # ここではDRFのフローに従い、404はget_objectで投げられる前提で、
        # 万が一のフォールバックとしてPublicSerializerを返しているが、
        # 厳密には例外を投げても良い。
        from rest_framework.exceptions import NotFound
        raise NotFound("この応募を表示する権限がないか、存在しません。")

    def create(self, request, *args, **kwargs):
        """応募作成（既存チェック付き）"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.request.user
        cat = serializer.validated_data['cat']

        # 既存の有効な応募があるかチェック（重複応募防止）
        existing_application = Application.objects.filter(
            applicant=user,
            cat=cat,
            status__in=['pending', 'reviewing', 'accepted']
        ).first()

        if existing_application:
            # 既に存在する場合はそのIDを返して、フロントエンドでリダイレクトさせる
            # 200 OK を返すことで「作成成功（ただし既存）」として扱う
            return Response({'id': existing_application.id, 'detail': '既に応募済みです。メッセージ画面へ移動します。'}, status=status.HTTP_200_OK)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # 応募者はログインユーザー固定
        # 冗長フィールド shelter もここで確実にセットし、データ整合性を担保する
        user = self.request.user
        cat = serializer.validated_data['cat']
        
        serializer.save(
            applicant=user,
            shelter=cat.shelter
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """ステータス更新アクション"""
        application = self.get_object()
        user = request.user
        
        # 権限チェック: 保護団体メンバーのみステータス変更可能
        is_shelter_member = False
        if user.user_type == 'shelter':
            is_shelter_member = ShelterUser.objects.filter(
                user=user,
                shelter_id=application.shelter_id, # 冗長フィールドを活用
                is_active=True
            ).exists()
            
        if not is_shelter_member:
             return Response(
                 {"detail": "この操作を行う権限がありません。"},
                 status=status.HTTP_403_FORBIDDEN
             )
             
        serializer = self.get_serializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """メッセージ管理 ViewSet"""
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        application_id = self.request.query_params.get('application')
        
        if not application_id:
            # application指定がない場合はエラー (全件取得は禁止)
            raise ValidationError({'application': 'applicationパラメータが必須です。'})
        
        queryset = Message.objects.all()
        queryset = queryset.filter(application_id=application_id)
            
        # 権限フィルタリング: 自分が関わっている応募のメッセージのみ
        
        # 1. 自分が応募者のメッセージ
        applicant_q = django_models.Q(application__applicant=user)
        
        # 2. 自分が保護団体メンバーであるメッセージ
        if user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=user, 
                is_active=True
            ).values_list('shelter_id', flat=True)
            
            # Application.shelter_id を利用して高速化
            shelter_q = django_models.Q(application__shelter_id__in=shelter_ids)
            
            # OR結合
            queryset = queryset.filter(applicant_q | shelter_q)
        else:
            # 一般ユーザーは自分の応募のみ
            queryset = queryset.filter(applicant_q)
            
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        """メッセージ作成時の固定ルール実装"""
        user = self.request.user
        
        # application_id の取得
        # Serializerで定めた write_only field 'application_id' を優先して使用
        application_id = serializer.validated_data.get('application_id')
        
        # フォールバック廃止: application_id を必須とする
        if not application_id:
            raise ValidationError({"application_id": "このフィールドは必須です。"})
            
        application = get_object_or_404(Application, pk=application_id)
        
        # 権限チェック
        is_applicant = (application.applicant == user)
        is_shelter_member = False
        
        if user.user_type == 'shelter':
            is_shelter_member = ShelterUser.objects.filter(
                user=user,
                shelter_id=application.shelter_id, # 冗長フィールドを活用
                is_active=True
            ).exists()
            
        if not (is_applicant or is_shelter_member):
             raise permissions.PermissionDenied("この応募にメッセージを送信する権限がありません。")
        
        # 送信者種別を判定して保存 (Admin > Shelter > User)
        sender_type = 'user'
        if user.user_type == 'admin': # Admin優先
            sender_type = 'admin'
        elif is_shelter_member:
            sender_type = 'shelter'

        # application, sender, sender_type を固定して保存
        # validated_data から application_id を削除する必要はない（saveのkwargsが優先/無視されるため）
        serializer.save(
            sender=user, 
            application=application,
            sender_type=sender_type
        )
