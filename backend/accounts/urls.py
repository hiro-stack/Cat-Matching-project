from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView, 
    UserProfileView, 
    ShelterRegistrationView, 
    EmailTokenObtainPairView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

urlpatterns = [
    path('register/shelter/', ShelterRegistrationView.as_view(), name='shelter-register'),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', EmailTokenObtainPairView.as_view(), name='token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
