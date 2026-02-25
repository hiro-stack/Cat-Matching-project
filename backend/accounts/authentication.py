from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """
    HttpOnly Cookie から JWT を読み取る認証クラス。

    優先順位:
    1. Authorization ヘッダー (既存のヘッダーベース認証との後方互換)
    2. access_token Cookie (HttpOnly Cookie)
    """

    def authenticate(self, request):
        # 1. まずヘッダーベース認証を試みる
        try:
            header_result = super().authenticate(request)
            if header_result is not None:
                return header_result
        except (AuthenticationFailed, InvalidToken, TokenError):
            pass

        # 2. HttpOnly Cookie から access_token を取得
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
