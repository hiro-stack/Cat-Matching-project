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
        
        # 管理者へ通知メール送信
        try:
            from django.core.mail import send_mail
            from shelters.models import ShelterUser
            
            # 作成されたばかりの団体情報を取得
            shelter_user = ShelterUser.objects.filter(user=user).select_related('shelter').first()
            shelter_name = shelter_user.shelter.name if shelter_user and shelter_user.shelter else '（団体名不明）'
            
            subject = '【保護猫マッチング】新規団体登録がありました'
            message = f"""
新規の保護団体登録がありました。
管理画面から内容を確認し、審査を行ってください。

団体名: {shelter_name}
登録ユーザー: {user.username} ({user.email})

審査管理画面: http://localhost:3000/admin/shelters
            """
            from_email = 'system@example.com'
            recipient_list = ['zhanghiromo@gmail.com']
            
            send_mail(subject, message, from_email, recipient_list)
            print(f"Notification email sent to {recipient_list}")
        except Exception as e:
            # メールの失敗で登録自体を失敗させない
            print(f"Failed to send notification email: {e}")
        
        return Response({
            'user': UserPrivateSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)



class UserProfileView(generics.RetrieveUpdateAPIView):
    """ユーザープロフィール取得・更新API"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        # 更新時(PUT/PATCH)は、更新可能なフィールドのみを定義した専用シリアライザーを使用
        if self.request.method in ['PUT', 'PATCH']:
            return UserMeUpdateSerializer
        # 取得時(GET)は、すべての個人情報を含むシリアライザーを使用
        return UserPrivateSerializer
    
    def get_object(self):
        return self.request.user


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

        # メール送信
        # TODO: フロントエンドURLを環境変数から取得するように変更推奨
        reset_link = f"http://localhost:3000/reset-password/{uid}/{token}" 
        subject = "【保護猫マッチング】パスワードリセット"
        message = f"""
パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

{reset_link}

※このリンクは有効期限があります。
お心当たりがない場合は、このメールを破棄してください。
        """
        from_email = "system@example.com"
        
        try:
            send_mail(subject, message, from_email, [email])
        except Exception as e:
            print(f"Failed to send email: {e}")
            return Response({"detail": "メール送信に失敗しました。"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "無効なリンクです。"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "トークンが無効または期限切れです。"}, status=status.HTTP_400_BAD_REQUEST)

        # パスワード設定
        user.set_password(new_password)
        user.save()

        return Response({"detail": "パスワードをリセットしました。"}, status=status.HTTP_200_OK)
