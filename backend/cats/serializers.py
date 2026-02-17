from rest_framework import serializers
from .models import Cat, CatImage, CatVideo
from shelters.models import ShelterUser

class CatImageSerializer(serializers.ModelSerializer):
    """保護猫画像シリアライザー"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CatImage
        fields = ['id', 'image', 'image_url', 'is_primary', 'sort_order', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def validate_is_primary(self, value):
        """is_primaryフィールドの値を明示的にbooleanに変換"""
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes')
        return bool(value)

class CatVideoSerializer(serializers.ModelSerializer):
    """保護猫動画シリアライザー"""
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = CatVideo
        fields = ['id', 'video', 'video_url', 'sort_order', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_video_url(self, obj):
        if obj.video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video.url)
            return obj.video.url
        return None

class CatListSerializer(serializers.ModelSerializer):
    """保護猫一覧用シリアライザー"""

    primary_image = serializers.SerializerMethodField()
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Cat
        fields = [
            'id', 'name', 'gender', 'age_category', 'estimated_age',
            'breed', 'size', 'color', 'status', 'primary_image',
            'shelter_name', 'created_at', 'is_favorited'
        ]

    def get_primary_image(self, obj):
        image_url = obj.primary_image_url
        if image_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    def get_is_favorited(self, obj):
        """ログイン中のユーザーがこの猫をお気に入り登録しているか"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from favorites.models import Favorite
            return Favorite.objects.filter(user=request.user, cat=obj).exists()
        return False

class ShelterInfoSerializer(serializers.Serializer):
    """保護団体情報シリアライザー（CatDetail用のネストされたシリアライザー）"""
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    shelter_type = serializers.CharField(read_only=True)
    prefecture = serializers.CharField(read_only=True)
    city = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True, allow_blank=True)
    email = serializers.EmailField(read_only=True, allow_blank=True)
    website_url = serializers.URLField(read_only=True, allow_blank=True)
    sns_url = serializers.URLField(read_only=True, allow_blank=True)
    business_hours = serializers.CharField(read_only=True, allow_blank=True)
    transfer_available_hours = serializers.CharField(read_only=True, allow_blank=True)


class CatDetailSerializer(serializers.ModelSerializer):
    """保護猫詳細用シリアライザー"""

    images = CatImageSerializer(many=True, read_only=True)
    videos = CatVideoSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    # 修正: Shelter情報をネストされたシリアライザーで返す
    shelter = ShelterInfoSerializer(read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)

    class Meta:
        model = Cat
        fields = [
            'id', 'name', 'gender', 'age_category', 'estimated_age',
            'breed', 'size', 'color',

            # 詳細情報
            'spay_neuter_status', 'vaccination_status', 'health_status_category',
            'fiv_felv_status', 'health_notes',

            # 性格
            'human_distance', 'activity_level', 'personality',

            # 譲渡条件
            'interview_format', 'trial_period', 'transfer_fee', 'fee_details',

            'description', 'status', 'is_public',
            'images', 'videos', 'primary_image', 'shelter', 'shelter_name',
            'created_at', 'updated_at', 'is_favorited'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_primary_image(self, obj):
        image_url = obj.primary_image_url
        if image_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    def get_is_favorited(self, obj):
        """ログイン中のユーザーがこの猫をお気に入り登録しているか"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from favorites.models import Favorite
            return Favorite.objects.filter(user=request.user, cat=obj).exists()
        return False

class CatCreateUpdateSerializer(serializers.ModelSerializer):
    """保護猫作成・更新用シリアライザー"""
    
    class Meta:
        model = Cat
        fields = [
            'name', 'gender', 'age_category', 'estimated_age',
            'breed', 'size', 'color', 
            'spay_neuter_status', 'vaccination_status', 'health_status_category', 
            'fiv_felv_status', 'health_notes',
            'human_distance', 'activity_level', 'personality',
            'interview_format', 'trial_period', 'transfer_fee', 'fee_details',
            'description', 'status', 'is_public'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        
        # 管理者以外の場合、制限フィールドをバリデーション対象外（任意）にする
        if request:
            is_admin = request.user.is_superuser
            if not is_admin:
                shelter_user = ShelterUser.objects.filter(user=request.user, is_active=True).first()
                if shelter_user and shelter_user.role == 'admin':
                    is_admin = True

            if not is_admin:
                restricted_fields = [
                    'status', 'description',
                    'health_notes', 'spay_neuter_status', 'vaccination_status', 
                    'health_status_category', 'fiv_felv_status',
                    'transfer_fee', 'fee_details', 'interview_format', 'trial_period'
                ]
                for field_name in restricted_fields:
                    if field_name in self.fields:
                        self.fields[field_name].required = False
                        self.fields[field_name].allow_blank = True

    def update(self, instance, validated_data):
        """医療情報と募集詳細の変更制限"""
        request = self.context.get('request')
        
        # 管理者（システム全体or団体内）以外の場合、以下のフィールドの変更を無効化（元の値を保持）
        if request:
            is_admin = request.user.is_superuser
            if not is_admin:
                shelter_user = ShelterUser.objects.filter(
                    user=request.user, 
                    shelter=instance.shelter,
                    is_active=True
                ).first()
                if shelter_user and shelter_user.role == 'admin':
                    is_admin = True

            if not is_admin:
                restricted_fields = [
                    # 掲載管理
                    'status', 'description',
                    # 医療情報
                    'health_notes', 'spay_neuter_status', 'vaccination_status', 
                    'health_status_category', 'fiv_felv_status',
                    # 譲渡条件
                    'transfer_fee', 'fee_details', 'interview_format', 'trial_period'
                ]
                
                for field in restricted_fields:
                    if field in validated_data:
                        validated_data.pop(field)

        return super().update(instance, validated_data)
