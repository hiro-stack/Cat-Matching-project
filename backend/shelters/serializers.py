from rest_framework import serializers
from .models import Shelter, ShelterUser

class ShelterSerializer(serializers.ModelSerializer):
    """保護団体モデルの基本シリアライザー"""
    class Meta:
        model = Shelter
        fields = [
            'id', 'name', 'shelter_type', 'prefecture', 'city', 
            'address', 'postcode', 'email', 'phone', 'website_url', 'sns_url',
            'business_hours', 'transfer_available_hours', 
            'registration_number', 'description', 
            'logo_image', 'header_image', 'public_profile_enabled',
            'rescue_accepting', 'rescue_area_text', 'rescue_notes',
            'support_goods_url', 'support_donation_url', 'support_message',
            'verification_status', 'contact_verified', 'review_message',
            'created_at', 'updated_at', 'representative'
        ]
        read_only_fields = ['id', 'verification_status', 'contact_verified', 'review_message', 'created_at', 'updated_at']

class ShelterPublicSerializer(serializers.ModelSerializer):
    """一般公開用の団体詳細シリアライザー"""
    class Meta:
        model = Shelter
        fields = [
            'id', 'name', 'shelter_type', 'prefecture', 'city',
            'address', 'postcode', 'email', 'logo_image', 'header_image', 'description',
            'website_url', 'sns_url',
            'business_hours', 'transfer_available_hours',
            'rescue_accepting', 'rescue_area_text', 'rescue_notes',
            'support_goods_url', 'support_donation_url', 'support_message',
            'verification_status', 'created_at'
        ]
        read_only_fields = fields

class ShelterRegistrationSerializer(serializers.Serializer):
    """保護団体＋管理ユーザー登録用シリアライザー (詳細Ver)"""
    # ユーザー情報 (Step 1)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    # 団体情報 (Step 2, 3, 4, 5)
    shelter_name = serializers.CharField(max_length=200)
    shelter_prefecture = serializers.CharField(max_length=50)
    shelter_city = serializers.CharField(max_length=100)
    
    shelter_email = serializers.EmailField()
    shelter_phone = serializers.CharField(max_length=20)
    
    shelter_postcode = serializers.CharField(max_length=10, required=False, allow_blank=True)
    shelter_address = serializers.CharField()
    
    shelter_website_url = serializers.URLField(required=False, allow_blank=True)
    shelter_sns_url = serializers.URLField(required=False, allow_blank=True)
    
    shelter_business_hours = serializers.CharField(required=False, allow_blank=True)
    shelter_transfer_available_hours = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("このユーザー名は既に使用されています。")
        return value

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("このメールアドレスは既に登録されています。")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "パスワードが一致しません"})
        return data

    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        from django.db import transaction
        User = get_user_model()
        
        with transaction.atomic():
            # 1. ユーザー作成 (user_type='shelter')
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                user_type='shelter'
            )
            
            # 2. 団体作成
            shelter = Shelter.objects.create(
                name=validated_data['shelter_name'],
                prefecture=validated_data['shelter_prefecture'],
                city=validated_data['shelter_city'],
                address=validated_data['shelter_address'],
                postcode=validated_data.get('shelter_postcode', ''),
                phone=validated_data['shelter_phone'],
                email=validated_data['shelter_email'],
                website_url=validated_data.get('shelter_website_url', ''),
                sns_url=validated_data.get('shelter_sns_url', ''),
                business_hours=validated_data.get('shelter_business_hours', ''),
                transfer_available_hours=validated_data.get('shelter_transfer_available_hours', ''),
                verification_status='pending' # 初期状態
            )
            
            # 3. 紐付け (管理者として)
            ShelterUser.objects.create(
                shelter=shelter,
                user=user,
                role='admin',
                is_active=True
            )
            
            return user

class ShelterMemberSerializer(serializers.ModelSerializer):
    """シェルターメンバー管理用シリアライザー"""
    user_id = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = ShelterUser
        fields = ['id', 'user_id', 'username', 'email', 'role', 'is_active', 'joined_at']
        read_only_fields = ['id', 'user_id', 'username', 'email', 'joined_at']

class ShelterMemberAddSerializer(serializers.Serializer):
    """メンバー追加用シリアライザー（メールアドレス指定）"""
    email = serializers.EmailField()

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("指定されたメールアドレスのユーザーが見つかりません。")
        return value
