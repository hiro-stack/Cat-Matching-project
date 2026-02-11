from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'cat', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'cat__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
