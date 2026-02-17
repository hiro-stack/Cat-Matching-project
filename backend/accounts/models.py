from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

class User(AbstractUser):
    """カスタムユーザーモデル"""
    
    USER_TYPE_CHOICES = [
        ('adopter', '飼い主希望者'),
        ('shelter', '保護団体スタッフ'),
        ('admin', '管理者'),
    ]
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='adopter',
        verbose_name='ユーザー種別'
    )
    # 基本的な連絡先情報はUserモデルに残すか、Profileに移すか。
    # 重複を避けるため、Userモデルは認証メインにし、詳細はProfileに任せるのが良いが、
    # 既存コードとの互換性を考え、一旦残すが、Profile側を正とする。
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='電話番号',
        help_text='国際番号対応のため20文字まで'
    )
    address = models.TextField(
        blank=True,
        verbose_name='住所'
    )
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        verbose_name='プロフィール画像'
    )
    bio = models.TextField(
        blank=True,
        verbose_name='自己紹介'
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
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class ApplicantProfile(models.Model):
    """応募者（里親希望者）プロフィール"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='applicant_profile',
        verbose_name='ユーザー'
    )
    
    # --- A. 初期登録（必須・マッチング基盤） ---
    
    # 基本属性
    age = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(18), MaxValueValidator(100)],
        verbose_name='年齢',
        null=True, blank=True # 最初は空かもしれない
    )
    
    GENDER_CHOICES = [
        ('male', '男性'),
        ('female', '女性'),
        ('other', 'その他'),
        ('no_answer', '回答しない'),
    ]
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        verbose_name='性別',
        help_text='団体提出用（スコアに使わない）',
        null=True, blank=True
    )
    
    # 居住情報
    residence_area = models.CharField(
        max_length=100,
        verbose_name='居住エリア（都道府県 / 市区町村）',
        null=True, blank=True
    )
    
    HOUSING_TYPE_CHOICES = [
        ('owned', '持ち家'),
        ('rented', '賃貸'),
    ]
    housing_type = models.CharField(
        max_length=20,
        choices=HOUSING_TYPE_CHOICES,
        verbose_name='住宅形態',
        null=True, blank=True
    )
    
    PET_ALLOWED_CHOICES = [
        ('allowed', '可（契約書あり）'),
        ('planned', '確認予定'),
        ('not_allowed', '不可'),
    ]
    pet_allowed = models.CharField(
        max_length=20,
        choices=PET_ALLOWED_CHOICES,
        verbose_name='ペット可否',
        null=True, blank=True
    )
    
    indoors_agreement = models.BooleanField(
        default=False,
        verbose_name='完全室内飼いへの同意（必須）'
    )
    
    # 生活リズム
    # 平均留守時間（選択式）
    ABSENCE_TIME_CHOICES = [
        ('less_than_4', '4時間未満'),
        ('4_to_8', '4〜8時間'),
        ('8_to_12', '8〜12時間'),
        ('more_than_12', '12時間以上'),
    ]
    absence_time = models.CharField(
        max_length=20,
        choices=ABSENCE_TIME_CHOICES,
        verbose_name='平均留守時間',
        null=True, blank=True
    )
    
    HOME_FREQUENCY_CHOICES = [
        ('high', '高'),
        ('medium', '中'),
        ('low', '低'),
    ]
    home_frequency = models.CharField(
        max_length=20,
        choices=HOME_FREQUENCY_CHOICES,
        verbose_name='在宅頻度',
        null=True, blank=True
    )
    
    # --- B. プロフィール（相性推定用・強く推奨） ---
    
    # 猫の飼育経験
    CAT_EXPERIENCE_CHOICES = [
        ('none', 'なし'),
        ('one', 'あり'),
        ('multiple', '複数経験'),
    ]
    cat_experience = models.CharField(
        max_length=20,
        choices=CAT_EXPERIENCE_CHOICES,
        verbose_name='猫の飼育経験',
        null=True, blank=True
    )
    
    # 猫との距離感
    CAT_DISTANCE_CHOICES = [
        ('clingy', 'べったり'),
        ('moderate', '適度'),
        ('watchful', '見守り型'),
    ]
    cat_distance = models.CharField(
        max_length=20,
        choices=CAT_DISTANCE_CHOICES,
        verbose_name='猫との距離感',
        null=True, blank=True
    )
    
    # 家の雰囲気
    HOME_ATMOSPHERE_CHOICES = [
        ('quiet', '静か'),
        ('normal', '普通'),
        ('lively', 'にぎやか'),
    ]
    home_atmosphere = models.CharField(
        max_length=20,
        choices=HOME_ATMOSPHERE_CHOICES,
        verbose_name='家の雰囲気',
        null=True, blank=True
    )
    
    # 来客頻度
    VISITOR_FREQUENCY_CHOICES = [
        ('high', '多い'),
        ('medium', '普通'),
        ('low', '少ない'),
    ]
    visitor_frequency = models.CharField(
        max_length=20,
        choices=VISITOR_FREQUENCY_CHOICES,
        verbose_name='来客頻度',
        null=True, blank=True
    )
    
    # 引っ越し予定
    MOVING_PLAN_CHOICES = [
        ('none', 'なし'),
        ('within_1_2_years', '1–2年以内'),
        ('undecided', '未定'),
    ]
    moving_plan = models.CharField(
        max_length=20,
        choices=MOVING_PLAN_CHOICES,
        verbose_name='引っ越し予定',
        null=True, blank=True
    )
    
    def __str__(self):
        return f"{self.user.username}'s Profile"


class EmailLog(models.Model):
    """メール送信ログ
    
    全てのメール送信を記録し、管理画面から送信結果を追跡可能にする。
    失敗時はリトライ管理コマンドで再送信可能。
    """
    
    STATUS_CHOICES = [
        ('pending', '送信待ち'),
        ('sent', '送信済み'),
        ('failed', '失敗'),
    ]
    
    TYPE_CHOICES = [
        ('password_reset', 'パスワードリセット'),
        ('shelter_registration', '団体登録通知'),
        ('shelter_approval', '団体承認通知'),
        ('shelter_rejection', '団体否認通知'),
        ('application_status', '応募ステータス変更'),
        ('other', 'その他'),
    ]
    
    email_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        verbose_name='メール種別'
    )
    to_email = models.EmailField(verbose_name='送信先')
    from_email = models.EmailField(
        default='noreply@example.com',
        verbose_name='送信元'
    )
    subject = models.CharField(max_length=200, verbose_name='件名')
    body = models.TextField(verbose_name='本文')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='送信状態'
    )
    error_message = models.TextField(blank=True, verbose_name='エラーメッセージ')
    
    related_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs',
        verbose_name='関連ユーザー'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='送信日時')
    retry_count = models.PositiveSmallIntegerField(default=0, verbose_name='リトライ回数')
    max_retries = models.PositiveSmallIntegerField(default=3, verbose_name='最大リトライ回数')
    
    class Meta:
        verbose_name = 'メール送信ログ'
        verbose_name_plural = 'メール送信ログ'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['email_type']),
            models.Index(fields=['to_email']),
        ]
    
    def __str__(self):
        return f"[{self.get_status_display()}] {self.email_type}: {self.to_email}"


class AuditLog(models.Model):
    """監査ログ
    
    ユーザー・団体・猫・応募など主要モデルの変更履歴を記録する。
    「消えた/抜けた」が起きた時に原因追跡が可能。
    """
    
    ACTION_CHOICES = [
        ('create', '作成'),
        ('update', '更新'),
        ('delete', '削除'),
    ]
    
    model_name = models.CharField(max_length=100, verbose_name='モデル名')
    object_id = models.PositiveIntegerField(verbose_name='オブジェクトID')
    object_repr = models.CharField(max_length=200, blank=True, verbose_name='オブジェクト表現')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='操作')
    changes = models.JSONField(default=dict, verbose_name='変更内容')
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='実行者'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IPアドレス')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='実行日時')
    
    class Meta:
        verbose_name = '監査ログ'
        verbose_name_plural = '監査ログ'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['actor']),
            models.Index(fields=['created_at']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"[{self.get_action_display()}] {self.model_name}#{self.object_id} by {self.actor}"
