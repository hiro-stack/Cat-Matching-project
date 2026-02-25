import hmac
import logging
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from shelters.serializers import ShelterRegistrationSerializer

from .serializers import (
    EmailTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    TwoFactorDisableSerializer,
    TwoFactorEnableSerializer,
    TwoFactorVerifySerializer,
    UserMeUpdateSerializer,
    UserPrivateSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# ─────────────────────────────────────────────────────────────
# HttpOnly Cookie ヘルパー
# ─────────────────────────────────────────────────────────────

def _set_auth_cookies(response, access_token=None, refresh_token=None):
    """
    JWTトークンを HttpOnly Cookie としてセットする。

    本番環境 (DEBUG=False): SameSite=None; Secure=True  → クロスオリジン対応
    開発環境 (DEBUG=True) : SameSite=Lax;  Secure=False → localhost 対応
    """
    from django.conf import settings as django_settings
    is_production = not django_settings.DEBUG
    samesite = 'None' if is_production else 'Lax'
    secure = is_production

    if access_token:
        response.set_cookie(
            'access_token',
            access_token,
            max_age=1800,       # 30分 (SIMPLE_JWT の ACCESS_TOKEN_LIFETIME に合わせる)
            httponly=True,
            secure=secure,
            samesite=samesite,
            path='/',
        )

    if refresh_token:
        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=604800,     # 7日 (SIMPLE_JWT の REFRESH_TOKEN_LIFETIME に合わせる)
            httponly=True,
            secure=secure,
            samesite=samesite,
            path='/',
        )


def _clear_auth_cookies(response):
    """HttpOnly Cookie を削除する（ログアウト用）"""
    from django.conf import settings as django_settings
    is_production = not django_settings.DEBUG
    samesite = 'None' if is_production else 'Lax'
    secure = is_production

    for key in ('access_token', 'refresh_token'):
        response.set_cookie(
            key, '', max_age=0,
            httponly=True, secure=secure, samesite=samesite, path='/',
        )


# ─────────────────────────────────────────────────────────────
# 登録 API
# ─────────────────────────────────────────────────────────────

class UserRegistrationView(generics.CreateAPIView):
    """ユーザー登録API (レート制限: 1時間に5回まで)"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    # ④ 登録エンドポイントへのレート制限
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        # メール認証 OTP を送信
        try:
            from .models import TwoFactorCode
            from .email_utils import send_tracked_email

            otp = TwoFactorCode.create_for_user(user)
            send_tracked_email(
                email_type='email_verification',
                to_email=user.email,
                subject='【保護猫マッチング】メールアドレスの確認',
                body=(
                    f'{user.username} さん、ご登録ありがとうございます。\n\n'
                    f'以下の確認コードを入力してメールアドレスを認証してください。\n\n'
                    f'確認コード: {otp.code}\n\n'
                    f'※このコードの有効期限は10分です。\n'
                    f'※お心当たりがない場合はこのメールを無視してください。'
                ),
                related_user=user,
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")

        response = Response(
            {'user': UserPrivateSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        # ① HttpOnly Cookie にトークンをセット（レスポンスボディには含めない）
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class ShelterRegistrationView(generics.CreateAPIView):
    """保護団体登録API (レート制限: 1時間に5回まで)"""

    serializer_class = ShelterRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        # 管理者へ通知メール送信
        try:
            from shelters.models import ShelterUser
            from .email_utils import send_tracked_email

            shelter_user = ShelterUser.objects.filter(user=user).select_related('shelter').first()
            shelter_name = shelter_user.shelter.name if shelter_user and shelter_user.shelter else '（団体名不明）'

            admin_frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            subject = '【保護猫マッチング】新規団体登録がありました'
            message = f"""
新規の保護団体登録がありました。
管理画面から内容を確認し、審査を行ってください。

団体名: {shelter_name}
登録ユーザー: {user.username} ({user.email})

審査管理画面: {admin_frontend_url}/admin/shelters
            """

            admin_email = os.environ.get('ADMIN_NOTIFICATION_EMAIL', 'zhanghiromo@gmail.com')
            send_tracked_email(
                email_type='shelter_registration',
                to_email=admin_email,
                subject=subject,
                body=message,
                related_user=user,
            )
        except Exception as e:
            logger.error(f"Failed to send notification email: {e}")

        response = Response(
            {'user': UserPrivateSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


# ─────────────────────────────────────────────────────────────
# ログイン / ログアウト / トークンリフレッシュ
# ─────────────────────────────────────────────────────────────

class EmailTokenObtainPairView(TokenObtainPairView):
    """メールアドレスとパスワードでログインするカスタムビュー

    ① トークンを HttpOnly Cookie にセット（レスポンスボディには含めない）
    ブルートフォース対策: 1分に10回まで
    """
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        tokens = serializer.validated_data
        user = tokens.get('user')

        # 2FA が有効なユーザーの場合: Cookie をセットせず OTP を送信する
        if user and user.is_2fa_enabled:
            from .models import TwoFactorCode
            from .email_utils import send_tracked_email

            otp = TwoFactorCode.create_for_user(user)
            send_tracked_email(
                email_type='two_factor',
                to_email=user.email,
                subject='【保護猫マッチング】ログイン確認コード',
                body=(
                    f'以下の確認コードを入力してログインを完了してください。\n\n'
                    f'確認コード: {otp.code}\n\n'
                    f'※このコードの有効期限は10分です。\n'
                    f'※お心当たりがない場合はこのメールを無視してください。'
                ),
                related_user=user,
            )
            return Response({'requires_2fa': True}, status=status.HTTP_200_OK)

        # 2FA なし: 通常通り Cookie をセット
        response = Response({'detail': 'ログインしました。'}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, tokens['access'], tokens['refresh'])
        return response


class LogoutView(APIView):
    """ログアウト API

    ② RefreshToken をブラックリスト化し HttpOnly Cookie を削除する。
    未認証でも呼べる（すでにログアウト済みの場合も正常終了）。
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # 無効・期限切れ・既にブラックリスト済みでも正常終了

        response = Response({'detail': 'ログアウトしました。'}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class CookieTokenRefreshView(APIView):
    """トークンリフレッシュ API（HttpOnly Cookie 対応版）

    ③ Cookie から RefreshToken を読み取り、新しいトークンを Cookie にセット。
    ROTATE_REFRESH_TOKENS=True により古い RefreshToken は自動的にブラックリスト化される。
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Cookie 優先、なければリクエストボディ（後方互換）
        refresh_token_value = request.COOKIES.get('refresh_token') or request.data.get('refresh')

        if not refresh_token_value:
            return Response(
                {'detail': 'セッションの有効期限が切れました。再度ログインしてください。'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token_value})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response(
                {'detail': 'セッションの有効期限が切れました。再度ログインしてください。'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({'detail': 'ok'}, status=status.HTTP_200_OK)
        new_access = serializer.validated_data['access']
        # ROTATE_REFRESH_TOKENS=True の場合、新しい RefreshToken も返る
        new_refresh = serializer.validated_data.get('refresh')
        _set_auth_cookies(response, access_token=new_access, refresh_token=new_refresh)
        return response


# ─────────────────────────────────────────────────────────────
# プロフィール
# ─────────────────────────────────────────────────────────────

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
        user = request.user
        data = self.get_serializer(user).data

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


# ─────────────────────────────────────────────────────────────
# パスワードリセット
# ─────────────────────────────────────────────────────────────

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

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # フロントエンドURLの取得（環境変数のみ信頼する。Origin/Refererはユーザー操作可能なため使用しない）
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

        frontend_url = frontend_url.rstrip('/')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

        subject = "【保護猫マッチング】パスワードリセット"
        message = f"""
パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

{reset_link}

※このリンクの有効期限は1時間です。
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
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            decoded_uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=decoded_uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            logger.warning(f"Password reset error (Invalid UID): {e}, uid: {uid}")
            return Response({"detail": "無効なリンクです。"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            logger.warning(f"Password reset error (Invalid Token): user={user.id}")
            return Response({"detail": "トークンが無効または期限切れです。"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "パスワードをリセットしました。"}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# 二段階認証 (Email OTP)
# ─────────────────────────────────────────────────────────────

class TwoFactorVerifyView(APIView):
    """ログイン時の 2FA コード検証 API

    email + code を受け取り、OTP が有効であれば HttpOnly Cookie をセットしてログイン完了。
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'  # 既存のレート制限を流用

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'detail': '無効なリクエストです。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import TwoFactorCode
        otp = (
            TwoFactorCode.objects
            .filter(user=user, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not otp or not otp.is_valid or not hmac.compare_digest(otp.code, code):
            return Response(
                {'detail': '確認コードが正しくないか、有効期限が切れています。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # コードを使用済みにする
        otp.is_used = True
        otp.save(update_fields=['is_used'])

        # JWT トークンを発行して Cookie にセット
        from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
        refresh = JWTRefreshToken.for_user(user)
        response = Response({'detail': 'ログインしました。'}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class TwoFactorEnableView(APIView):
    """2FA 有効化 API

    code なし → OTP をメール送信して 200 を返す
    code あり → OTP を検証して 2FA を有効化
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorEnableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data.get('code', '').strip()
        user = request.user

        if not code:
            # コードなし → OTP を送信
            from .models import TwoFactorCode
            from .email_utils import send_tracked_email

            otp = TwoFactorCode.create_for_user(user)
            success, _ = send_tracked_email(
                email_type='two_factor',
                to_email=user.email,
                subject='【保護猫マッチング】二段階認証の設定確認コード',
                body=(
                    f'以下の確認コードを入力して二段階認証を有効にしてください。\n\n'
                    f'確認コード: {otp.code}\n\n'
                    f'※このコードの有効期限は10分です。'
                ),
                related_user=user,
            )
            if not success:
                return Response(
                    {'detail': 'メール送信に失敗しました。しばらく待ってから再度お試しください。'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response({'detail': '確認コードをメールに送信しました。'}, status=status.HTTP_200_OK)

        # コードあり → 検証して有効化
        from .models import TwoFactorCode
        otp = (
            TwoFactorCode.objects
            .filter(user=user, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not otp or not otp.is_valid or not hmac.compare_digest(otp.code, code):
            return Response(
                {'detail': '確認コードが正しくないか、有効期限が切れています。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        user.is_2fa_enabled = True
        user.save(update_fields=['is_2fa_enabled'])

        return Response({'detail': '二段階認証を有効にしました。'}, status=status.HTTP_200_OK)


class TwoFactorDisableView(APIView):
    """2FA 無効化 API（現在のパスワード確認必須）"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['password']):
            return Response(
                {'detail': 'パスワードが正しくありません。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_2fa_enabled = False
        user.save(update_fields=['is_2fa_enabled'])
        return Response({'detail': '二段階認証を無効にしました。'}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# メールアドレス認証 (サインアップ後)
# ─────────────────────────────────────────────────────────────

class EmailVerifyView(APIView):
    """メールアドレス認証 API

    サインアップ後に送信された OTP コードを検証し、
    is_email_verified = True にする。
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        code = request.data.get('code', '').strip()
        if not code or len(code) != 6:
            return Response(
                {'detail': '確認コードを6桁で入力してください。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        from .models import TwoFactorCode
        otp = (
            TwoFactorCode.objects
            .filter(user=user, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not otp or not otp.is_valid or not hmac.compare_digest(otp.code, code):
            return Response(
                {'detail': '確認コードが正しくないか、有効期限が切れています。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        return Response({'detail': 'メールアドレスを認証しました。'}, status=status.HTTP_200_OK)


class EmailVerifyResendView(APIView):
    """メール認証コード再送信 API"""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        user = request.user

        if user.is_email_verified:
            return Response(
                {'detail': 'すでにメールアドレスは認証済みです。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import TwoFactorCode
        from .email_utils import send_tracked_email

        otp = TwoFactorCode.create_for_user(user)
        success, _ = send_tracked_email(
            email_type='email_verification',
            to_email=user.email,
            subject='【保護猫マッチング】メールアドレスの確認（再送）',
            body=(
                f'確認コードを再送しました。\n\n'
                f'確認コード: {otp.code}\n\n'
                f'※このコードの有効期限は10分です。'
            ),
            related_user=user,
        )

        if not success:
            return Response(
                {'detail': 'メール送信に失敗しました。しばらく待ってから再度お試しください。'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'detail': '確認コードを再送しました。'}, status=status.HTTP_200_OK)
