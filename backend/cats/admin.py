from django.contrib import admin
from .models import Cat, CatImage, CatVideo
from shelters.models import ShelterUser


class CatImageInline(admin.TabularInline):
    """猫画像インライン（猫編集画面で画像を追加）"""
    model = CatImage
    extra = 1
    fields = ['image', 'is_primary', 'sort_order', 'caption']


class CatVideoInline(admin.TabularInline):
    """猫動画インライン（猫編集画面で動画を追加）"""
    model = CatVideo
    extra = 1
    fields = ['video', 'sort_order', 'caption']


@admin.register(Cat)
class CatAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'age_category', 'estimated_age', 'spay_neuter_status', 'vaccination_status', 'shelter', 'status']
    list_filter = (
        'status', 'gender', 'age_category', 
        'shelter', 'is_public',
        'affection_level', 'maintenance_level'
    )
    search_fields = ['name', 'breed', 'color', 'shelter__name']
    inlines = [CatImageInline, CatVideoInline]  # 画像と動画を統合
    readonly_fields = ['created_at', 'updated_at']
    
    def age_display(self, obj):
        return f"{obj.age_years}歳{obj.age_months}ヶ月"
    age_display.short_description = '年齢'
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の猫のみ表示"""
        qs = super().get_queryset(request)
        
        # 管理者は全て表示
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        # 団体ユーザーは自団体の猫のみ
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(shelter_id__in=shelter_ids)
        
        # 一般ユーザーは閲覧不可
        return qs.none()
    
    def has_add_permission(self, request):
        """追加権限：管理者と団体ユーザーのみ"""
        if request.user.is_superuser or request.user.user_type in ['admin', 'shelter']:
            return True
        return False
    
    def has_change_permission(self, request, obj=None):
        """編集権限：管理者と所属団体のスタッフのみ"""
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        
        if obj and request.user.user_type == 'shelter':
            # 自団体の猫のみ編集可能
            return ShelterUser.objects.filter(
                shelter=obj.shelter,
                user=request.user,
                is_active=True
            ).exists()
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除権限：編集権限と同じ"""
        return self.has_change_permission(request, obj)
    
    def save_model(self, request, obj, form, change):
        """保存時に自動的に団体を設定"""
        if not change and request.user.user_type == 'shelter':
            # 新規作成時、団体ユーザーの所属団体を自動設定
            shelter_user = ShelterUser.objects.filter(
                user=request.user,
                is_active=True,
                role='admin'
            ).first()
            
            if shelter_user:
                obj.shelter = shelter_user.shelter
        
        super().save_model(request, obj, form, change)


@admin.register(CatImage)
class CatImageAdmin(admin.ModelAdmin):
    list_display = ['cat', 'is_primary', 'sort_order', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['cat__name']
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の猫の画像のみ表示"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(cat__shelter_id__in=shelter_ids)
        
        return qs.none()
    
    def save_model(self, request, obj, form, change):
        """メイン画像を複数にしない（自動解除）"""
        if obj.is_primary:
            # 同じ猫の他の画像のメインフラグを外す
            CatImage.objects.filter(
                cat=obj.cat,
                is_primary=True
            ).exclude(pk=obj.pk).update(is_primary=False)
        
        super().save_model(request, obj, form, change)


@admin.register(CatVideo)
class CatVideoAdmin(admin.ModelAdmin):
    list_display = ['cat', 'sort_order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cat__name']
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の猫の動画のみ表示"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(cat__shelter_id__in=shelter_ids)
        
        return qs.none()
