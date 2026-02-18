from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserPrivateSerializer, 
    UserRegistrationSerializer, 
    UserMeUpdateSerializer
)
from shelters.serializers import ShelterRegistrationSerializer
import os

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """ユーザー登録API"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWTトークンの生成
        refresh = RefreshToken.for_user(user)
        
        # 登録成功時は、本人に返すので PrivateSerializer を使用
        return Response({
            'user': UserPrivateSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class ShelterRegistrationView(generics.CreateAPIView):
    """保護団体登録API"""
    
    serializer_class = ShelterRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        # 管理者へ通知メール送信（追跡可能）
        try:
            from .email_utils import send_tracked_email
            from shelters.models import ShelterUser
            
            shelter_user = ShelterUser.objects.filter(user=user).select_related('shelter').first()
            shelter_name = shelter_user.shelter.name if shelter_user and shelter_user.shelter else '（団体名不明）'
            
            admin_frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            subject = '【】新規団体登録がありました'
            message = f"""
新規の保護団体登録がありました。
管理画面から内容を確認し、審査を行ってください。

団体名: {shelter_name}
登録ユーザー: {user.username} ({user.email})

審査管理画面: {admin_frontend_url}/admin/shelters
            """
            
            send_tracked_email(
                email_type='shelter_registration',
                to_email='zhanghiromo@gmail.com',
                subject=subject,
                body=message,
                related_user=user,
            )
        except Exception as e:
            # メールの失敗で登録自体を失敗させない
            import logging
            logging.getLogger(__name__).error(f"Failed to send notification email: {e}")
        
        return Response({
            'user': UserPrivateSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)



class UserProfileView(generics.RetrieveUpdateAPIView):
    """ユーザープロフィール取得・更新API（申請状態付き）"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserMeUpdateSerializer
        return UserPrivateSerializer
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        """GET /api/accounts/profile/ - 申請状態を含むレスポンス"""
        user = request.user
        data = self.get_serializer(user).data
        
        # 申請中の団体情報を追加（フロントが画面分岐に使用）
        from shelters.models import ShelterUser
        shelter_membership = ShelterUser.objects.filter(
            user=user, is_active=True
        ).select_related('shelter').first()
        
        if shelter_membership:
            data['shelter_status'] = shelter_membership.shelter.verification_status
            data['shelter_id'] = shelter_membership.shelter.id
            data['shelter_name'] = shelter_membership.shelter.name
        else:
            data['shelter_status'] = None
            data['shelter_id'] = None
        
        return Response(data)


# メールアドレスでログインするカスタムビュー
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    """メールアドレスとパスワードでログインするカスタムビュー"""
    serializer_class = EmailTokenObtainPairSerializer


from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

class PasswordResetRequestView(APIView):
    """パスワードリセット要求API"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # セキュリティのため、ユーザーが存在しない場合も成功レスポンスを返す
            return Response({"detail": "パスワードリセットメールを送信しました。"}, status=status.HTTP_200_OK)

        # トークン生成
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # フロントエンドURLの取得（環境変数 > Originヘッダ > Refererヘッダ > localhost）
        frontend_url = os.environ.get('FRONTEND_URL')
        if not frontend_url:
            # 環境変数がなければリクエストヘッダから推測
            origin = request.META.get('HTTP_ORIGIN')
            if origin:
                frontend_url = origin
            else:
                referer = request.META.get('HTTP_REFERER')
                if referer:
                    # 末尾のパスを削除してベースURLを取得 (例: http://site.com/forgot-password/ -> http://site.com)
                    from urllib.parse import urlparse
                    parsed = urlparse(referer)
                    frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # それでも取れなければデフォルト
        if not frontend_url:
            frontend_url = 'http://localhost:3000'
            
        frontend_url = frontend_url.rstrip('/')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
        
        subject = "【保護猫マッチング】パスワードリセット"
        message = f"""
パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

{reset_link}

※このリンクは有効期限があります。
お心当たりがない場合は、このメールを破棄してください。
        """
        
        from .email_utils import send_tracked_email
        success, email_log = send_tracked_email(
            email_type='password_reset',
            to_email=email,
            subject=subject,
            body=message,
            related_user=user,
        )
        
        if not success:
            return Response(
                {"detail": "メール送信に失敗しました。しばらく待ってから再度お試しください。"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({"detail": "パスワードリセットメールを送信しました。"}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """パスワードリセット確定API"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            # デバッグログを追加
            # print(f"Received UID: {uid}")
            # print(f"Received Token: {token}")
            
            # UIDのデコード
            decoded_uid = force_str(urlsafe_base64_decode(uid))
            # print(f"Decoded UID: {decoded_uid}")
            
            user = User.objects.get(pk=decoded_uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            print(f"Password reset error (Invalid UID): {e}, uid: {uid}")
            return Response({"detail": "無効なリンクです。"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            print(f"Password reset error (Invalid Token): user={user.id}, token={token}")
            return Response({"detail": "トークンが無効または期限切れです。"}, status=status.HTTP_400_BAD_REQUEST)

        # パスワード設定
        user.set_password(new_password)
        user.save()

        return Response({"detail": "パスワードをリセットしました。"}, status=status.HTTP_200_OK)
