from django.urls import path
from .views import (
    UserRegistrationView,
    ShelterRegistrationView,
    UserProfileView,
    EmailTokenObtainPairView,
    LogoutView,
    CookieTokenRefreshView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    TwoFactorVerifyView,
    TwoFactorEnableView,
    TwoFactorDisableView,
    EmailVerifyView,
    EmailVerifyResendView,
)

urlpatterns = [
    path('register/shelter/', ShelterRegistrationView.as_view(), name='shelter-register'),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', EmailTokenObtainPairView.as_view(), name='token-obtain'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa-enable'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('email-verify/', EmailVerifyView.as_view(), name='email-verify'),
    path('email-verify/resend/', EmailVerifyResendView.as_view(), name='email-verify-resend'),
]
