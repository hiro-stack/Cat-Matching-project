from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShelterViewSet, ShelterMemberViewSet

router = DefaultRouter()
router.register(r'members', ShelterMemberViewSet, basename='shelter-members')
router.register(r'', ShelterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
