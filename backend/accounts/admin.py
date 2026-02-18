from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ApplicantProfile, EmailLog, AuditLog


class ApplicantProfileInline(admin.StackedInline):
    """ユーザー詳細画面にプロフィールを埋め込む"""
    model = ApplicantProfile
    can_delete = False
    verbose_name_plural = '里親希望者プロフィール'
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'created_at']
    list_filter = ['user_type', 'is_staff', 'created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('追加情報', {'fields': ('user_type', 'phone_number', 'address', 'profile_image', 'bio')}),
    )
    inlines = [ApplicantProfileInline]


@admin.register(ApplicantProfile)
class ApplicantProfileAdmin(admin.ModelAdmin):
    """プロフィール単独管理画面"""
    list_display = ['user', 'age', 'gender', 'residence_area', 'marital_status', 'has_indoors_agreement']
    list_filter = ['gender', 'marital_status', 'income_status', 'pet_policy_confirmed']
    search_fields = ['user__username', 'user__email', 'residence_area']
    
    def has_indoors_agreement(self, obj):
        return obj.indoors_agreement
    has_indoors_agreement.boolean = True
    has_indoors_agreement.short_description = '室内飼い同意'


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    """メール送信ログ管理画面"""
    list_display = ['email_type', 'to_email', 'status', 'created_at', 'sent_at', 'retry_count']
    list_filter = ['status', 'email_type', 'created_at']
    search_fields = ['to_email', 'subject', 'body']
    readonly_fields = [
        'email_type', 'to_email', 'from_email', 'subject', 'body',
        'status', 'error_message', 'related_user',
        'created_at', 'sent_at', 'retry_count', 'max_retries'
    ]
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False  # 管理画面から直接追加はできない
    
    def has_change_permission(self, request, obj=None):
        return False  # 読み取り専用


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """監査ログ管理画面"""
    list_display = ['model_name', 'object_id', 'action', 'actor', 'created_at']
    list_filter = ['model_name', 'action', 'created_at']
    search_fields = ['model_name', 'object_repr', 'actor__username']
    readonly_fields = [
        'model_name', 'object_id', 'object_repr', 'action',
        'changes', 'actor', 'ip_address', 'created_at'
    ]
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
