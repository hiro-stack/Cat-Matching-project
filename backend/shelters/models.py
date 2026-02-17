from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class Shelter(models.Model):
    """保護団体モデル（独立） - 保護猫カフェ"""
    
    # --- A. カフェプロフィール（必須） ---
    
    name = models.CharField(
        max_length=200,
        verbose_name='カフェ名（団体名）'
    )
    # 種別：保護猫カフェ（固定）
    SHELTER_TYPE_CHOICES = [
        ('cafe', '保護猫カフェ'),
    ]
    shelter_type = models.CharField(
        max_length=20,
        choices=SHELTER_TYPE_CHOICES,
        default='cafe',
        verbose_name='種別'
    )
    
    # 保護活動エリア（公開）
    prefecture = models.CharField(
        max_length=50,
        verbose_name='都道府県',
        default='東京都'
    )
    city = models.CharField(
        max_length=100,
        verbose_name='市区町村',
        default='〇〇区'
    )
    address = models.TextField(
        verbose_name='店舗住所'
    )
    postcode = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='郵便番号'
    )
    
    # 代表連絡先（必須・一部非公開）
    email = models.EmailField(
        verbose_name='代表メールアドレス',
        help_text='必須・一部非公開',
        default=''
    )
    phone = models.CharField(
        max_length=20,
        verbose_name='代表電話番号',
        help_text='必須・非公開',
        default=''
    )
    
    # 公式サイト / SNS（任意・推奨）
    website_url = models.URLField(
        blank=True,
        verbose_name='公式サイトURL'
    )
    sns_url = models.URLField(
        blank=True,
        verbose_name='SNS URL',
        help_text='InstagramやTwitterなど'
    )
    
    # 営業情報
    business_hours = models.TextField(
        blank=True,
        verbose_name='営業日・営業時間・定休日'
    )
    transfer_available_hours = models.TextField(
        blank=True,
        verbose_name='譲渡対応可能な時間帯'
    )
    
    # 既存フィールド
    representative = models.CharField(
        max_length=100,
        verbose_name='代表者名',
        blank=True
    )
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='動物取扱業登録番号'
    )

    # --- B. 一般公開プロフィール設定（新規追加） ---
    
    public_profile_enabled = models.BooleanField(
        default=False,
        verbose_name='プロフィール一般公開',
        help_text='承認済みの団体のみ公開可能です'
    )
    
    logo_image = models.ImageField(
        upload_to='shelters/logos/',
        blank=True,
        null=True,
        verbose_name='団体ロゴアイコン'
    )
    
    header_image = models.ImageField(
        upload_to='shelters/headers/',
        blank=True,
        null=True,
        verbose_name='ヘッダー画像'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='団体紹介文',
        help_text='活動方針、譲渡の流れ、カフェの雰囲気など'
    )
    
    # 一般からの保護受付
    rescue_accepting = models.BooleanField(
        default=False,
        verbose_name='一般からの保護受付'
    )
    rescue_area_text = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='保護受付地域'
    )
    rescue_notes = models.TextField(
        blank=True,
        verbose_name='保護受付に関する注意事項'
    )
    
    # 支援募集
    support_goods_url = models.URLField(
        blank=True,
        verbose_name='物資支援リンク'
    )
    support_donation_url = models.URLField(
        blank=True,
        verbose_name='寄付・支援金リンク'
    )
    support_message = models.TextField(
        blank=True,
        verbose_name='支援のお願いメッセージ'
    )

    # --- C. 運営管理項目 ---
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', '審査中'),
        ('approved', '承認済み'),
        ('rejected', '否認'),
        ('need_fix', '修正依頼中'),
        ('suspended', '利用停止中'),
    ]
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending',
        verbose_name='審査ステータス'
    )
    review_message = models.TextField(
        blank=True,
        verbose_name='審査メッセージ'
    )
    contact_verified = models.BooleanField(
        default=False,
        verbose_name='連絡先確認済み'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='登録日時'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )
    
    class Meta:
        verbose_name = '保護団体'
        verbose_name_plural = '保護団体'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ShelterUser(models.Model):
    """保護団体とユーザーの紐付け（多対多）"""
    
    ROLE_CHOICES = [
        ('admin', '管理者'),
        ('staff', 'スタッフ'),
    ]
    
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name='shelter_users',
        verbose_name='保護団体'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shelter_memberships',
        verbose_name='ユーザー'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='staff',
        verbose_name='役割'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='有効'
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='参加日時'
    )
    
    class Meta:
        verbose_name = '保護団体メンバー'
        verbose_name_plural = '保護団体メンバー'
        constraints = [
            models.UniqueConstraint(
                fields=['shelter', 'user'],
                name='unique_shelter_user'
            )
        ]
        indexes = [
            models.Index(fields=['shelter']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.shelter.name} - {self.user.username} ({self.get_role_display()})"
