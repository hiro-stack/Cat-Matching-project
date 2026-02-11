from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Shelter, ShelterUser
from .serializers import ShelterSerializer, ShelterMemberSerializer

class ShelterViewSet(viewsets.ModelViewSet):
    """保護団体情報管理 ViewSet"""
    queryset = Shelter.objects.all()
    serializer_class = ShelterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーが所属している団体のみを返す"""
        user = self.request.user
        if user.is_superuser:
            return Shelter.objects.all()
        
        # 所属している有効なシェルターのIDを取得
        shelter_ids = ShelterUser.objects.filter(
            user=user, 
            is_active=True
        ).values_list('shelter_id', flat=True)
        
        return Shelter.objects.filter(id__in=shelter_ids)

    @action(detail=False, methods=['get'], url_path='my-shelter')
    def my_shelter(self, request):
        """ログイン中のユーザーが所属するシェルター情報を取得"""
        shelter_user = ShelterUser.objects.filter(user=request.user, is_active=True).first()
        if not shelter_user:
            return Response({"detail": "所属する保護団体が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(shelter_user.shelter)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        """運営管理者による団体の審査・承認アクション"""
        if not request.user.is_superuser:
            return Response({"detail": "権限がありません。"}, status=status.HTTP_403_FORBIDDEN)
            
        shelter = self.get_object()
        new_status = request.data.get('status')
        review_message = request.data.get('review_message', '')
        
        if new_status not in dict(Shelter.VERIFICATION_STATUS_CHOICES):
            return Response({"detail": "不正なステータスです。"}, status=status.HTTP_400_BAD_REQUEST)
            
        shelter.verification_status = new_status
        shelter.review_message = review_message
        
        # 承認時はメッセージをクリアする運用もあり
        if new_status == 'approved':
            # 必要ならメール送信ロジックをここに
            pass
            
        shelter.save()
        return Response(self.get_serializer(shelter).data)

    def update(self, request, *args, **kwargs):
        """管理者（admin）のみ更新可能"""
        shelter = self.get_object()
        user = request.user
        
        # スタッフや管理者でも verification_status は変更できないように制限すべき
        if 'verification_status' in request.data and not user.is_superuser:
            return Response({"detail": "審査ステータスを変更する権限はありません。"}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_superuser:
            shelter_user = ShelterUser.objects.filter(
                user=user, 
                shelter=shelter, 
                is_active=True,
                role='admin'
            ).exists()
            
            if not shelter_user:
                return Response(
                    {"detail": "保護団体情報を更新する権限がありません。管理者のみ可能です。"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """管理者（admin）のみ更新可能"""
        return self.update(request, *args, **kwargs)


class ShelterMemberViewSet(viewsets.ModelViewSet):
    """保護団体メンバー管理 ViewSet"""
    serializer_class = ShelterMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """自分が所属するシェルターのメンバーを返す（管理者のみ）"""
        user = self.request.user
        
        if user.is_superuser:
            return ShelterUser.objects.all()

        # 自分が管理者として所属しているアクティブなシェルターを取得
        my_shelter_admins = ShelterUser.objects.filter(
            user=user, 
            is_active=True,
            role='admin'
        ).values_list('shelter', flat=True)

        if not my_shelter_admins:
            return ShelterUser.objects.none()

        # そのシェルターに所属する全てのメンバーを返す
        return ShelterUser.objects.filter(shelter__in=my_shelter_admins)

    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import ShelterMemberAddSerializer
            return ShelterMemberAddSerializer
        return ShelterMemberSerializer

    def create(self, request, *args, **kwargs):
        """メンバーを追加 (メールアドレス指定)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        # 自身が管理者として所属するシェルターを取得 (複数ある場合は最初の一つを対象とする運用)
        user = request.user
        shelter_user_admin = ShelterUser.objects.filter(
            user=user, 
            is_active=True,
            role='admin'
        ).first()
        
        if not shelter_user_admin:
             return Response({"detail": "管理者権限がありません。"}, status=status.HTTP_403_FORBIDDEN)
             
        shelter = shelter_user_admin.shelter
        
        # 追加対象のユーザーを取得
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = User.objects.get(email=email)
        
        # 既にメンバーかどうかチェック
        if ShelterUser.objects.filter(shelter=shelter, user=target_user).exists():
            return Response({"detail": "このユーザーは既にメンバーです。"}, status=status.HTTP_400_BAD_REQUEST)
            
        # メンバーとして追加
        ShelterUser.objects.create(
            shelter=shelter,
            user=target_user,
            role='staff', # デフォルトはスタッフ
            is_active=True
        )
        
        # ユーザータイプを shelter に更新 (もしまだ更新されていなければ)
        if target_user.user_type != 'shelter' and not target_user.is_superuser:
            target_user.user_type = 'shelter'
            target_user.save()
            
        return Response({"detail": "メンバーを追加しました。"}, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        """物理削除ではなく論理削除（無効化）"""
        # 最後の管理者は削除できないようにする制御が必要
        if instance.role == 'admin':
            active_admins_count = ShelterUser.objects.filter(
                shelter=instance.shelter, 
                role='admin', 
                is_active=True
            ).count()
            if active_admins_count <= 1:
                # viewsets.ModelViewSetでは通常例外を投げるかResponseを返すが、perform_destroyは戻り値を返さないので例外で中断する
                from rest_framework.exceptions import ValidationError
                raise ValidationError("最後の管理者は削除できません。")

        instance.is_active = False
        instance.save()
