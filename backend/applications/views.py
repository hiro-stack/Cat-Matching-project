from rest_framework import viewsets, permissions, status, filters
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from django.shortcuts import get_object_or_404
from django.db import models as django_models, transaction
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
        queryset = Application.objects.filter(applicant=user, is_hidden_by_applicant=False)
        
        # 2. 保護団体ユーザーの場合、自団体の猫への応募も含める
        if user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=user, 
                is_active=True
            ).values_list('shelter_id', flat=True)
            
            queryset = queryset | Application.objects.filter(
                shelter_id__in=shelter_ids,
                is_hidden_by_shelter=False
            )
            
        return queryset.distinct().order_by('-applied_at')

    def get_serializer_class(self):
        # archiveアクション用
        if self.action == 'archive':
            return ApplicationSerializer
            
        # 1. 作成時
        if self.action == 'create':
            return ApplicationCreateSerializer
            
        # 2. 一覧表示時
        if self.action == 'list':
            return ApplicationSerializer
            
        # 3. ステータス更新時 (アクション)
        if self.action == 'update_status':
            return ApplicationStatusUpdateSerializer
            
        # 4. 詳細表示時 (retrieve)
        if self.action == 'retrieve':
            instance = self.get_object()
            user = self.request.user
            
            # アクセス者が保護団体メンバーかどうか判定
            is_shelter_member = False
            if user.user_type == 'shelter':
                is_shelter_member = ShelterUser.objects.filter(
                    user=user,
                    shelter_id=instance.shelter_id,
                    is_active=True
                ).exists()
            
            if is_shelter_member:
                # 自動ステータス更新: pending(新着) の状態で団体が見たら reviewing(チャット中) にする
                if instance.status == 'pending':
                    instance.status = 'reviewing'
                    instance.save()
                
                return ApplicationDetailForShelterSerializer
            elif instance.applicant == user:
                return ApplicationDetailForOwnerSerializer
        
        from rest_framework.exceptions import NotFound
        raise NotFound("この応募を表示する権限がないか、存在しません。")

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """応募履歴を非表示（アーカイブ）にする"""
        application = self.get_object()
        user = request.user
        
        # 1. 応募者本人の場合
        if application.applicant == user:
            # 完了・却下・キャンセル済みのみ非表示可能
            if application.status not in ['accepted', 'rejected', 'cancelled']:
                return Response(
                    {"detail": "進行中の応募は削除（非表示）できません。"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            application.is_hidden_by_applicant = True
            application.save()
            return Response({"detail": "履歴を非表示にしました。"})
            
        # 2. 保護団体メンバーの場合
        is_shelter_member = False
        if user.user_type == 'shelter':
            is_shelter_member = ShelterUser.objects.filter(
                user=user,
                shelter_id=application.shelter_id,
                is_active=True
            ).exists()
            
        if is_shelter_member:
            # 完了・却下・キャンセル済みのみ非表示可能
            if application.status not in ['accepted', 'rejected', 'cancelled']:
                return Response(
                    {"detail": "進行中の応募は削除（非表示）できません。"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            application.is_hidden_by_shelter = True
            application.save()
            return Response({"detail": "履歴を非表示にしました。"})
            
        return Response({"detail": "権限がありません。"}, status=status.HTTP_403_FORBIDDEN)

    def create(self, request, *args, **kwargs):
        """応募作成（冪等化 + 競合防止付き）"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.request.user
        cat = serializer.validated_data['cat']

        # 団体審査状況チェック: 承認済みでない場合は応募不可
        if cat.shelter.verification_status != 'approved':
            raise ValidationError("現在この団体への応募は受け付けておりません（団体審査中）。")

        # select_for_update で競合防止（同時リクエストを直列化）
        with transaction.atomic():
            existing_application = Application.objects.select_for_update().filter(
                applicant=user,
                cat=cat,
                status__in=['pending', 'reviewing', 'trial', 'accepted']
            ).first()

            if existing_application:
                # 冪等: 既に存在する場合は同じ結果を返す
                return Response({
                    'id': existing_application.id,
                    'status': existing_application.status,
                    'updated_at': existing_application.updated_at.isoformat(),
                    'detail': '既に応募済みです。メッセージ画面へ移動します。'
                }, status=status.HTTP_200_OK)

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
        """ステータス更新アクション（状態マシン + 競合防止）"""
        application = self.get_object()
        user = request.user
        
        # 権限チェック: 保護団体メンバーのみステータス変更可能
        is_shelter_member = False
        if user.user_type == 'shelter':
            is_shelter_member = ShelterUser.objects.filter(
                user=user,
                shelter_id=application.shelter_id,
                is_active=True
            ).exists()
            
        if not is_shelter_member:
             return Response(
                 {"detail": "この操作を行う権限がありません。"},
                 status=status.HTTP_403_FORBIDDEN
             )
        
        # select_for_update で競合防止（同時更新を直列化）
        with transaction.atomic():
            application = Application.objects.select_for_update().get(pk=application.pk)
            
            serializer = self.get_serializer(application, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        
        # レスポンスに現在状態 + 次に可能なアクションを含める
        return Response({
            'id': application.id,
            'status': application.status,
            'status_display': application.get_status_display(),
            'updated_at': application.updated_at.isoformat(),
            'allowed_actions': ApplicationStatusUpdateSerializer.ALLOWED_TRANSITIONS.get(
                application.status, []
            ),
        })


class MessageViewSet(viewsets.ModelViewSet):
    """メッセージ管理 ViewSet"""
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # チャットなので全件取得（または独自に制御）
    
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

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """特定の応募に関するメッセージを既読にする"""
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "application_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        application = get_object_or_404(Application, pk=application_id)
        
        # 権限チェック
        is_applicant = (application.applicant == user)
        is_shelter_member = False
        if user.user_type == 'shelter':
            is_shelter_member = ShelterUser.objects.filter(
                user=user, 
                shelter_id=application.shelter_id, 
                is_active=True
            ).exists()
            
        if not (is_applicant or is_shelter_member):
             raise permissions.PermissionDenied("権限がありません。")
             
        # 未読メッセージを抽出
        target_messages = Message.objects.filter(
            application=application,
            read_at__isnull=True
        )
        
        if is_applicant:
            # 応募者の場合：団体または管理者からのメッセージを既読にする
            target_messages = target_messages.exclude(sender_type='user')
        elif is_shelter_member:
            # 団体の場合：ユーザーからのメッセージを既読にする
            target_messages = target_messages.filter(sender_type='user')
            
        updated_count = target_messages.update(read_at=timezone.now())
        
        return Response({"marked_read_count": updated_count}, status=status.HTTP_200_OK)

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
        
        # スタッフ権限の制限: チャットは閲覧のみ可能
        if is_shelter_member and not user.is_superuser:
            shelter_user = ShelterUser.objects.filter(
                user=user,
                shelter_id=application.shelter_id,
                is_active=True
            ).first()
            if shelter_user and shelter_user.role == 'staff':
                raise PermissionDenied("スタッフ権限ではメッセージを送信できません。")
        
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
