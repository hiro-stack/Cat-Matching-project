from django.db import models
from django.db import transaction
from django.contrib.auth import get_user_model
from django.conf import settings
from shelters.models import Shelter

User = get_user_model()


class Cat(models.Model):
    """保護猫モデル（保護猫カフェ向け詳細版）"""
    
    # --- 基本情報 ---
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name='cats',
        verbose_name='保護団体'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='名前（仮名OK）'
    )
    
    GENDER_CHOICES = [
        ('male', 'オス'),
        ('female', 'メス'),
        ('unknown', '不明'),
    ]
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        default='unknown',
        verbose_name='性別'
    )
    
    # 年齢区分（内部用）
    AGE_CATEGORY_CHOICES = [
        ('kitten', '子猫'),
        ('adult', '成猫'),
        ('senior', 'シニア猫'),
        ('unknown', '不明'),
    ]
    age_category = models.CharField(
        max_length=20,
        choices=AGE_CATEGORY_CHOICES,
        default='unknown',
        verbose_name='年齢区分'
    )
    
    estimated_age = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='推定年齢',
        help_text='例: 2歳くらい, 2023年春生まれ',
        default=''
    )
    

    
    # Breed, Size, Color は引き続き使用可能だが、任意入力
    breed = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='品種'
    )
    SIZE_CHOICES = [
        ('small', '小型'),
        ('medium', '中型'),
        ('large', '大型'),
    ]
    size = models.CharField(
        max_length=10,
        choices=SIZE_CHOICES,
        default='medium',
        verbose_name='体格'
    )
    color = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='毛色'
    )
    
    # --- 医療情報 ---
    
    SPAY_NEUTER_CHOICES = [
        ('not_yet', '未'),
        ('done', '済'),
        ('planned', '予定'),
        ('unknown', '不明'),
    ]
    spay_neuter_status = models.CharField(
        max_length=20,
        choices=SPAY_NEUTER_CHOICES,
        default='unknown',
        verbose_name='不妊去勢'
    )
    # 古い boolean フィールドは移行用
    neutered = models.BooleanField(default=False, verbose_name='不妊去勢（旧）')

    VACCINATION_CHOICES = [
        ('not_yet', '未'),
        ('partial', '一部'),
        ('done', '済'),
        ('unknown', '不明'),
    ]
    vaccination_status = models.CharField(
        max_length=20,
        choices=VACCINATION_CHOICES,
        default='unknown',
        verbose_name='ワクチン'
    )
    # 古い boolean フィールドは移行用
    vaccination = models.BooleanField(default=False, verbose_name='ワクチン（旧）')
    
    # 健康状態
    HEALTH_STATUS_CHOICES = [
        ('healthy', '問題なし'),
        ('needs_care', 'ケアあり'),
        ('treatment', '継続治療'),
        ('unknown', '不明'),
    ]
    health_status_category = models.CharField(
        max_length=20,
        choices=HEALTH_STATUS_CHOICES,
        default='unknown',
        verbose_name='健康状態区分'
    )
    health_notes = models.TextField(
        blank=True,
        verbose_name='健康状態詳細'
    ) # 旧 health_status
    
    FIV_FELV_CHOICES = [
        ('negative', '陰性'),
        ('positive_fiv', 'FIV陽性'),
        ('positive_felv', 'FeLV陽性'),
        ('positive_double', 'ダブルキャリア'),
        ('untested', '未検査'),
        ('unknown', '不明'),
    ]
    fiv_felv_status = models.CharField(
        max_length=20,
        choices=FIV_FELV_CHOICES,
        default='unknown',
        verbose_name='ウイルス検査（FIV/FeLV）'
    )
    
    # --- 性格・特徴 ---
    
    AFFECTION_LEVEL_CHOICES = [
        (5, 'とろとろ甘えん坊（膝乗り・抱っこ大好き）'),
        (4, '甘えん坊（ナデナデ大好き）'),
        (3, 'ツンデレ・気まぐれ（気が向くと甘える）'),
        (2, 'クール・マイペース（適度な距離感）'),
        (1, '怖がり・修行中（ゆっくり仲良くなろう）'),
    ]
    affection_level = models.PositiveSmallIntegerField(
        choices=AFFECTION_LEVEL_CHOICES,
        default=3,
        verbose_name='甘えん坊度'
    )
    
    MAINTENANCE_LEVEL_CHOICES = [
        ('easy', '初心者でも安心（協力的）'),
        ('normal', '少しコツが必要（普通）'),
        ('hard', '経験者向き（要練習）'),
    ]
    maintenance_level = models.CharField(
        max_length=20,
        choices=MAINTENANCE_LEVEL_CHOICES,
        default='normal',
        verbose_name='お手入れ難易度',
        help_text='爪切り・投薬・ブラッシングなどのしやすさ'
    )
    
    # --- 譲渡条件 ---
    
    is_single_ok = models.BooleanField(
        default=False, 
        verbose_name='単身者応募可（非推奨）'
    )
    
    is_elderly_ok = models.BooleanField(
        default=False, 
        verbose_name='高齢者応募可（非推奨）'
    )
    
    other_terms = models.TextField(
        blank=True,
        verbose_name='譲渡条件',
        help_text='例：ペット可物件必須、脱走防止対策必須、単身者・高齢者の応募可否など。詳細な条件を記載することで、ミスマッチを減らせます。'
    )
    
    ACTIVITY_LEVEL_CHOICES = [
        ('active', '活発'),
        ('normal', '普通'),
        ('calm', 'おっとり'),
        ('unknown', '不明'),
    ]
    activity_level = models.CharField(
        max_length=20,
        choices=ACTIVITY_LEVEL_CHOICES,
        default='unknown',
        verbose_name='活発さ'
    )
    
    personality = models.TextField(
        blank=True,
        verbose_name='性格詳細'
    )
    
    # --- 掲載管理・紹介文 ---
    
    STATUS_CHOICES = [
        ('open', '募集中'),
        ('paused', '一時停止'),
        ('in_review', '審査中'),
        ('trial', 'トライアル中'),
        ('adopted', '譲渡済み'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='open',
        verbose_name='募集ステータス'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='紹介文（短文）'
    )

    is_public = models.BooleanField(
        default=False,
        verbose_name='公開設定',
        help_text='承認済みの団体のみ公開可能です'
    )
    
    # --- C. 譲渡に関する事実情報 ---
    
    INTERVIEW_FORMAT_CHOICES = [
        ('online', 'オンライン'),
        ('offline', '対面'),
        ('both', '両方可'),
    ]
    interview_format = models.CharField(
        max_length=20,
        choices=INTERVIEW_FORMAT_CHOICES,
        default='offline',
        verbose_name='面談形式'
    )
    
    trial_period = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='トライアル期間',
        help_text='例: 2週間, なし'
    )
    
    transfer_fee = models.PositiveIntegerField(
        default=0,
        verbose_name='譲渡費用'
    )
    
    fee_details = models.TextField(
        blank=True,
        verbose_name='費用に含まれる内容'
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
        verbose_name = '保護猫'
        verbose_name_plural = '保護猫'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_gender_display()})"
    
    def clean(self):
        """整合性チェック"""
        from django.core.exceptions import ValidationError
        
        # 公開設定のチェック: 団体が承認済みでない場合は公開不可
        if self.is_public:
            if self.shelter.verification_status != 'approved':
                raise ValidationError({
                    'is_public': '所属団体が「承認済み」でないため、公開設定を有効にできません。下書きとして保存してください。'
                })
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def primary_image_url(self):
        """メイン画像URLを返す（無ければプレースホルダ）"""
        # メイン画像を取得（複数ある場合は sort_order, created_at で決定）
        primary_image = self.images.filter(is_primary=True).order_by('sort_order', 'created_at').first()
        if primary_image and primary_image.image and hasattr(primary_image.image, 'url'):
            return primary_image.image.url
        
        # メイン画像が無い場合はプレースホルダ
        return settings.STATIC_URL + 'images/placeholder_cat.svg'
    
    @property
    def sub_images(self):
        """サブ画像一覧を返す（メイン以外、並び順付き）"""
        return self.images.filter(is_primary=False).order_by('sort_order', 'created_at')
    
    @property
    def sub_videos(self):
        """サブ動画一覧を返す（並び順付き）"""
        return self.videos.all().order_by('sort_order', 'created_at')


class CatImage(models.Model):
    """保護猫画像モデル"""
    
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='保護猫'
    )
    image = models.ImageField(
        upload_to='cats/',
        verbose_name='画像'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='メイン画像'
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='表示順'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='キャプション'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='アップロード日時'
    )
    
    class Meta:
        verbose_name = '保護猫画像'
        verbose_name_plural = '保護猫画像'
        ordering = ['-is_primary', 'sort_order', 'created_at']
        indexes = [
            models.Index(fields=['cat', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.cat.name}の画像"
    
    def save(self, *args, **kwargs):
        """メイン画像を1枚に制限"""
        self.full_clean()
        
        if self.is_primary:
            with transaction.atomic():
                Cat.objects.select_for_update().get(pk=self.cat_id)
                CatImage.objects.filter( cat_id=self.cat_id, is_primary=True ).exclude(pk=self.pk).update(is_primary=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)


class CatVideo(models.Model):
    """保護猫動画モデル"""
    
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='videos',
        verbose_name='保護猫'
    )
    video = models.FileField(
        upload_to='cats/videos/',
        verbose_name='動画ファイル'
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='表示順'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='キャプション'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='アップロード日時'
    )
    
    class Meta:
        verbose_name = '保護猫動画'
        verbose_name_plural = '保護猫動画'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['cat', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.cat.name}の動画"
