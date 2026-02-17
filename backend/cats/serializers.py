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
            'affection_level', 'maintenance_level', 'activity_level', 'personality',

            # 譲渡条件
            'interview_format', 'trial_period', 'transfer_fee', 'fee_details',
            'is_single_ok', 'is_elderly_ok', 'other_terms',

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
            'id',  # IDをレスポンスに含めるために追加
            'name', 'gender', 'age_category', 'estimated_age',
            'breed', 'size', 'color', 
            'spay_neuter_status', 'vaccination_status', 'health_status_category', 
            'fiv_felv_status', 'health_notes',
            'affection_level', 'maintenance_level', 'activity_level', 'personality',
            'interview_format', 'trial_period', 'transfer_fee', 'fee_details',
            'is_single_ok', 'is_elderly_ok', 'other_terms',
            'description', 'status', 'is_public'
        ]

    def validate(self, data):
        """スタッフ権限による不正なフィールド更新・作成を防止"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return data

        from shelters.models import ShelterUser
        
        # 団体IDの特定 (更新時はinstanceから、作成時はdataのshelterから、あるいはリクエストユーザーから)
        shelter = None
        if self.instance:
            shelter = self.instance.shelter
        elif 'shelter' in data:
            shelter = data['shelter']
        
        # 団体が特定できない場合は、ユーザーが所属する有効な団体を取得
        if not shelter:
            shelter_user_obj = ShelterUser.objects.filter(user=request.user, is_active=True).first()
            if shelter_user_obj:
                shelter = shelter_user_obj.shelter

        if not shelter:
            return data

        shelter_user = ShelterUser.objects.filter(
            user=request.user,
            shelter=shelter,
            is_active=True
        ).first()

        # スタッフ権限の場合の制限
        if shelter_user and shelter_user.role == 'staff':
            # 管理者のみが「作成・更新」両方で制限されるフィールド
            # 性格・特徴関連以外で、特に重要なもの
            strict_restricted_fields = [
                'status', 'is_public', 
                'interview_format', 'trial_period', 'transfer_fee', 'fee_details',
                'description', 'is_single_ok', 'is_elderly_ok', 'other_terms'
            ]
            
            # 「更新時のみ」制限されるフィールド
            update_only_restricted_fields = [
                'name', 'gender', 'age_category', 'estimated_age', 'breed', 'size', 'color',
                'spay_neuter_status', 'vaccination_status', 'health_status_category', 
                'fiv_felv_status', 'health_notes'
            ]

            changed_restricted_fields = []

            # 1. 厳格な制限フィールドのチェック (作成・更新共通)
            for field in strict_restricted_fields:
                if field in data:
                    new_val = data[field]
                    if self.instance:
                        current_val = getattr(self.instance, field)
                        if str(current_val) != str(new_val):
                            changed_restricted_fields.append(field)
                    else:
                        # 新規作成時、モデルのデフォルト値以外を設定しようとしたらNG
                        # 各フィールドの期待されるデフォルト値を定義
                        field_defaults = {
                            'is_public': False,
                            'status': 'open',
                            'interview_format': 'offline',
                            'trial_period': '',
                            'transfer_fee': 0,
                            'fee_details': '',
                            'description': '', # フロントエンドでスタッフに制限したため
                            'is_single_ok': False,
                            'is_elderly_ok': False,
                            'other_terms': ''
                        }
                        
                        if field in field_defaults:
                            if new_val != field_defaults[field]:
                                changed_restricted_fields.append(field)
                        elif new_val: 
                            # 定義外の制限フィールドに値が入っている場合
                            changed_restricted_fields.append(field)

            # 2. 更新時のみの制限チェック
            if self.instance:
                for field in update_only_restricted_fields:
                    if field in data:
                        current_val = getattr(self.instance, field)
                        new_val = data[field]
                        # 厳密な比較（str化で安全に比較）
                        if str(current_val) != str(new_val):
                            changed_restricted_fields.append(field)

            if changed_restricted_fields:
                raise ValidationError({
                    field: "スタッフ権限ではこの項目を設定・変更できません。管理者に依頼してください。"
                    for field in changed_restricted_fields
                })

        return data

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
