"""
URL configuration for cat matching project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


from .views import health_check, contact_view

urlpatterns = [
    path('healthz/', health_check, name='health_check'),
    path('api/contact/', contact_view, name='contact'),
    path('django-admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/cats/', include('cats.urls')),
    path('api/shelters/', include('shelters.urls')),
    path('api/applications/', include('applications.urls_applications')),
    path('api/messages/', include('applications.urls_messages')),
    path('api/favorites/', include('favorites.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
