from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import ApplicantProfile

User = get_user_model()


from shelters.models import ShelterUser

class ApplicantProfileSerializer(serializers.ModelSerializer):
    """応募者プロフィールシリアライザー"""
    
    class Meta:
        model = ApplicantProfile
        fields = [
            'age', 'gender', 'residence_area', 'pet_policy_confirmed',
            'marital_status', 'income_status',
            'indoors_agreement', 'absence_time',
            'home_frequency',
            'cat_experience', 'cat_distance', 'home_atmosphere',
            'visitor_frequency'
        ]

class UserPrivateSerializer(serializers.ModelSerializer):
    """ユーザー詳細シリアライザー（管理者・本人・保護団体用）
    
    【取扱注意】
    個人情報（email, phone_number, address）を含みます。
    公開APIでは絶対に使用せず、権限チェック済みのViewでのみ使用してください。
    
    ユーザーが自分の情報を確認（GET）する際に主に使用します。
    更新には UserMeUpdateSerializer を推奨します。
    """
    
    shelter_role = serializers.SerializerMethodField()
    shelter_info = serializers.SerializerMethodField()
    applicant_profile = ApplicantProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type', 'phone_number',
            'address', 'profile_image', 'bio', 'created_at',
            'shelter_role', 'shelter_info', 'is_superuser', 'applicant_profile',
            'is_2fa_enabled', 'is_email_verified',
        ]
        # GET用として安全性を確保（万が一更新に使われても重要項目は不可）
        read_only_fields = ['id', 'username', 'email', 'user_type', 'created_at']

    def get_shelter_role(self, obj):
        if obj.user_type != 'shelter':
            return None
            
        shelter_user = ShelterUser.objects.filter(user=obj, is_active=True).first()
        if shelter_user:
            return shelter_user.role
        return None

    def get_shelter_info(self, obj):
        if obj.user_type != 'shelter':
            return None
            
        shelter_user = ShelterUser.objects.filter(user=obj, is_active=True).first()
        if shelter_user:
            return {
                'id': shelter_user.shelter.id,
                'name': shelter_user.shelter.name,
                'prefecture': shelter_user.shelter.prefecture,
                'city': shelter_user.shelter.city,
                'address': shelter_user.shelter.address,
                'verification_status': shelter_user.shelter.verification_status,
                'review_message': shelter_user.shelter.review_message,
            }
        return None


class UserMeUpdateSerializer(serializers.ModelSerializer):
    """ユーザー本人によるプロフィール更新用シリアライザー
    
    セキュリティ対策:
    - user_type, email, username などの重要フィールドを含めない（またはread_only）。
    - ユーザーが任意に変更して良いフィールドのみを許可する。
    """
    applicant_profile = ApplicantProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'address', 'profile_image', 'bio', 
            # 以下のフィールドは表示のみ（更新不可）
            'username', 'email', 'user_type',
            'applicant_profile'
        ]
        read_only_fields = ['id', 'username', 'email', 'user_type']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('applicant_profile', None)
        
        # User情報の更新
        instance = super().update(instance, validated_data)
        
        # Profileの更新
        if profile_data is not None:
            # ユーザー種別に関わらず、個人としてのプロフィール情報を保持できるようにする
            profile, created = ApplicantProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance


class UserPublicSerializer(serializers.ModelSerializer):
    """公開用ユーザーシリアライザー（他人が見る用）
    
    セキュリティ対策: 
    - 個人情報（メール、電話、住所）を完全に除外
    - IDは公開（プロフィールリンク等で使用するため）
    """
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'user_type', 'profile_image', 'bio'
        ]
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """ユーザー登録用シリアライザー
    
    セキュリティ対策: 
    - user_typeを自由入力させない（adopter固定）
    - password_confirm による確認
    - email 必須
    """
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    # emailは必須入力とする
    email = serializers.EmailField(required=True)
    residence_area = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'phone_number', 'address', 'residence_area'
        ]
    
    def validate_username(self, value):
        """ユーザー名の重複チェック"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("このユーザー名は既に使用されています。")
        return value

    def validate_email(self, value):
        """メールアドレスの重複チェック"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("このメールアドレスは既に登録されています。")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "パスワードが一致しません"})
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(data['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        try:
            # ユーザータイプをadopter（飼い主希望者）に固定
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                user_type='adopter',
                phone_number=validated_data.get('phone_number', ''),
                address=validated_data.get('address', '')
            )
            # プロフィールも作成し、居住エリアを保存
            ApplicantProfile.objects.create(
                user=user,
                residence_area=validated_data.get('residence_area', '')
            )
            return user
        except IntegrityError:
            raise serializers.ValidationError("ユーザー登録中にエラーが発生しました。")


# カスタムJWTシリアライザー（メールアドレスでログイン）
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """メールアドレスとパスワードでログインするカスタムシリアライザー"""

    username_field = User.EMAIL_FIELD

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # usernameフィールドをemailに置き換える
        self.fields[self.username_field] = serializers.EmailField(required=True, label='メールアドレス')
        self.fields.pop('username', None)  # usernameフィールドを削除

    def validate(self, attrs):
        email = attrs.get(self.username_field) or attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('メールアドレスとパスワードを入力してください。')

        # メールアドレスでユーザーを検索
        # セキュリティ: メール存在/パスワード誤りで同一メッセージを返し、ユーザー列挙攻撃を防ぐ
        _generic_error = serializers.ValidationError(
            {'non_field_errors': 'メールアドレスまたはパスワードが正しくありません。'}
        )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise _generic_error

        # パスワードを検証
        if not user.check_password(password):
            raise _generic_error

        if not user.is_active:
            raise serializers.ValidationError(
                'このアカウントは現在利用できません。アカウントが無効化されている可能性があります。'
                'お心当たりがない場合はお問い合わせください。'
            )

        # JWTトークンを生成
        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user,  # View 側で 2FA チェックに使用
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    """パスワードリセット要求用シリアライザー"""
    email = serializers.EmailField()

    def validate_email(self, value):
        # ユーザーが存在するか確認（セキュリティのため存在しない場合もエラーにはしないのが一般的だが、
        # 利便性のために今回は存在チェックを行うか、Viewで処理する）
        # ここでは単純にバリデーションのみ行う
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """パスワードリセット確定用シリアライザー"""
    new_password = serializers.CharField(write_only=True, min_length=8)
    re_new_password = serializers.CharField(write_only=True, min_length=8)
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['re_new_password']:
            raise serializers.ValidationError({"re_new_password": "パスワードが一致しません"})
        return data


class TwoFactorVerifySerializer(serializers.Serializer):
    """ログイン時の 2FA コード検証用シリアライザー"""
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


class TwoFactorEnableSerializer(serializers.Serializer):
    """2FA 有効化用シリアライザー（code なし → 送信、code あり → 確認）"""
    code = serializers.CharField(max_length=6, min_length=6, required=False, allow_blank=True)


class TwoFactorDisableSerializer(serializers.Serializer):
    """2FA 無効化用シリアライザー（現在パスワード必須）"""
    password = serializers.CharField(write_only=True)
