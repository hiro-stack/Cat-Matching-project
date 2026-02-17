"""
Django management command to create test data for the cat matching application.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.files.base import ContentFile
from accounts.models import User
from shelters.models import Shelter, ShelterUser
from cats.models import Cat, CatImage, CatVideo
import random
import urllib.request
import io


class Command(BaseCommand):
    help = 'Create test data for development and demo purposes'

    def download_placeholder_image(self, width=800, height=600, cat_id=1):
        """Download a placeholder image from picsum.photos"""
        try:
            # Use Lorem Picsum - more reliable than placekitten
            url = f'https://picsum.photos/{width}/{height}?random={cat_id}'
            response = urllib.request.urlopen(url, timeout=15)
            return ContentFile(response.read(), name=f'cat_{cat_id}.jpg')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  ⚠ Could not download image: {e}'))
            return None

    def download_placeholder_video(self, video_id=1):
        """Download a small sample video file"""
        try:
            # Use a rotating list of small sample videos (< 1MB each)
            # These are short, open-source sample videos
            sample_videos = [
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
            ]

            # Select a video based on video_id
            url = sample_videos[video_id % len(sample_videos)]

            self.stdout.write(f'  Downloading video from {url[:50]}...')
            response = urllib.request.urlopen(url, timeout=30)
            content = response.read()
            self.stdout.write(f'  Downloaded {len(content) / 1024:.1f} KB')

            return ContentFile(content, name=f'cat_video_{video_id}.mp4')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  ⚠ Could not download video: {e}'))
            return None

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting test data creation...'))

        with transaction.atomic():
            # 1. Create Superuser
            self.stdout.write('Creating superuser...')
            superuser, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@example.com',
                    'user_type': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if created:
                superuser.set_password('admin123')
                superuser.save()
                self.stdout.write(self.style.SUCCESS('✓ Superuser created: admin / admin123'))

            # 2. Create Shelter Organizations and Staff
            self.stdout.write('Creating shelters and staff...')
            shelters_data = [
                {
                    'username': 'neko_heart',
                    'password': 'shelter123',
                    'name': '猫の心保護団体',
                    'email': 'info@nekoheart.org',
                    'verification_status': 'approved',
                    'description': '東京都を中心に保護猫の譲渡活動を行っています。',
                    'business_hours': '平日 11:00-20:00\n土日祝 10:00-19:00\n定休日: 水曜',
                    'transfer_available_hours': '平日 14:00-16:00\n土日祝 11:00-17:00（要予約）',
                    'staff': [
                        {'username': 'neko_staff1', 'password': 'staff123'},
                        {'username': 'neko_staff2', 'password': 'staff123'},
                    ]
                },
                {
                    'username': 'happy_cats',
                    'password': 'shelter123',
                    'name': 'ハッピーキャッツ',
                    'email': 'contact@happycats.jp',
                    'verification_status': 'approved',
                    'description': '大阪で活動する保護猫カフェ併設の団体です。',
                    'business_hours': '毎日 10:00-18:00\n定休日: なし',
                    'transfer_available_hours': '毎日 13:00-17:00（事前予約制）',
                    'staff': [
                        {'username': 'happy_staff1', 'password': 'staff123'},
                    ]
                },
                {
                    'username': 'cat_rescue',
                    'password': 'shelter123',
                    'name': 'キャットレスキュー福岡',
                    'email': 'info@catrescue-fukuoka.org',
                    'verification_status': 'approved',
                    'description': '福岡県内の保護猫を中心に活動しています。',
                    'business_hours': '火〜日 12:00-19:00\n定休日: 月曜',
                    'transfer_available_hours': '土日のみ 14:00-18:00（完全予約制）',
                    'staff': []
                },
                {
                    'username': 'new_shelter',
                    'password': 'shelter123',
                    'name': '新規保護団体',
                    'email': 'new@shelter.org',
                    'verification_status': 'pending',
                    'description': '申請中の新しい団体です。',
                    'business_hours': '平日のみ 10:00-17:00\n定休日: 土日祝',
                    'transfer_available_hours': '平日 13:00-16:00（要相談）',
                    'staff': []
                },
            ]

            shelters = []
            for shelter_data in shelters_data:
                # Create shelter admin user
                user, created = User.objects.get_or_create(
                    username=shelter_data['username'],
                    defaults={
                        'email': shelter_data['email'],
                        'user_type': 'shelter',
                    }
                )
                if created:
                    user.set_password(shelter_data['password'])
                    user.save()

                # Create shelter
                shelter, created = Shelter.objects.get_or_create(
                    name=shelter_data['name'],
                    defaults={
                        'email': shelter_data['email'],
                        'phone': '03-0000-0000',
                        'prefecture': '東京都',
                        'city': '渋谷区',
                        'address': '〇〇1-2-3',
                        'description': shelter_data['description'],
                        'verification_status': shelter_data['verification_status'],
                        'business_hours': shelter_data.get('business_hours', ''),
                        'transfer_available_hours': shelter_data.get('transfer_available_hours', ''),
                    }
                )
                shelters.append(shelter)

                # Link user to shelter as admin
                ShelterUser.objects.get_or_create(
                    shelter=shelter,
                    user=user,
                    defaults={'role': 'admin'}
                )

                self.stdout.write(self.style.SUCCESS(
                    f'✓ Shelter: {shelter.name} ({shelter_data["username"]} / {shelter_data["password"]})'
                ))

                # Create staff members
                for i, staff_data in enumerate(shelter_data['staff'], 1):
                    staff_user, created = User.objects.get_or_create(
                        username=staff_data['username'],
                        defaults={
                            'email': f'{staff_data["username"]}@example.org',
                            'user_type': 'shelter',
                        }
                    )
                    if created:
                        staff_user.set_password(staff_data['password'])
                        staff_user.save()

                    # Link staff to shelter
                    ShelterUser.objects.get_or_create(
                        shelter=shelter,
                        user=staff_user,
                        defaults={'role': 'staff'}
                    )
                    self.stdout.write(f'  ✓ Staff: {staff_data["username"]} / {staff_data["password"]}')

            # 3. Create Cats
            self.stdout.write('Creating cats...')
            cat_names = [
                'たま', 'ミケ', 'クロ', 'シロ', 'トラ', 'チビ', 'モモ', 'サクラ',
                'ハナ', 'ソラ', 'ユキ', 'コタロウ', 'ハチ', 'レオ', 'ルナ',
                'ベル', 'チョコ', 'マロン', 'ココ', 'モカ'
            ]

            breeds = ['ミックス', '日本猫', 'アメリカンショートヘア', 'スコティッシュフォールド', 'ペルシャ']
            colors = ['黒', '白', '茶トラ', 'キジトラ', '三毛', 'サバトラ', 'グレー']

            for i, name in enumerate(cat_names[:15]):
                shelter = shelters[i % len(shelters)]

                # Only create cats for approved shelters
                if shelter.verification_status != 'approved':
                    continue

                age_category = random.choice(['kitten', 'adult', 'senior'])
                estimated_ages = {
                    'kitten': ['生後3ヶ月', '生後6ヶ月', '1歳未満'],
                    'adult': ['2歳くらい', '3〜4歳', '5歳前後'],
                    'senior': ['7歳くらい', '8〜10歳', '10歳以上']
                }

                cat = Cat.objects.create(
                    name=name,
                    shelter=shelter,
                    gender=random.choice(['male', 'female']),
                    age_category=age_category,
                    estimated_age=random.choice(estimated_ages[age_category]),
                    breed=random.choice(breeds),
                    size=random.choice(['small', 'medium', 'large']),
                    color=random.choice(colors),

                    # Health info
                    spay_neuter_status=random.choice(['done', 'not_yet', 'planned']),
                    vaccination_status=random.choice(['done', 'partial', 'not_yet']),
                    fiv_felv_status=random.choice(['negative', 'untested']),
                    health_status_category='healthy',

                    # Personality
                    affection_level=random.randint(1, 5),
                    maintenance_level=random.choice(['easy', 'normal', 'hard']),
                    activity_level=random.choice(['active', 'normal', 'calm']),
                    personality=f'{name}はとても可愛い猫です。',

                    # Transfer info
                    interview_format=random.choice(['offline', 'online', 'both']),
                    trial_period='2週間',
                    transfer_fee=random.choice([0, 10000, 15000, 20000]),
                    fee_details='ワクチン接種費用として',
                    is_single_ok=random.choice([True, False]),
                    is_elderly_ok=random.choice([True, False]),
                    other_terms='ペット可物件必須、脱走防止対策必須、ご家族全員の同意など',

                    description=f'{name}は{shelter.name}で保護された猫です。新しい家族を探しています。',
                    status='open',
                    is_public=True,
                )

                self.stdout.write(f'✓ Cat: {cat.name} ({shelter.name})')

                # Add images for this cat (primary + 2-3 sub images)
                num_images = random.randint(3, 4)
                for img_idx in range(num_images):
                    image_file = self.download_placeholder_image(
                        width=random.choice([600, 800, 1000]),
                        height=random.choice([600, 800, 1000]),
                        cat_id=(i * 10 + img_idx)
                    )

                    if image_file:
                        CatImage.objects.create(
                            cat=cat,
                            image=image_file,
                            is_primary=(img_idx == 0),
                            sort_order=img_idx,
                            caption=f'{name}の写真{img_idx + 1}' if img_idx > 0 else f'{name}のメイン写真'
                        )
                        self.stdout.write(f'  📷 Image {img_idx + 1} added')

                # Add 1-2 videos (actual video files)
                num_videos = random.randint(0, 2)
                for vid_idx in range(num_videos):
                    # Download actual sample video file
                    video_file = self.download_placeholder_video(
                        video_id=(i * 10 + vid_idx)
                    )

                    if video_file:
                        CatVideo.objects.create(
                            cat=cat,
                            video=video_file,
                            sort_order=vid_idx,
                            caption=f'{name}の動画{vid_idx + 1}'
                        )
                        self.stdout.write(f'  🎥 Video {vid_idx + 1} added')

            # 4. Create Regular Users (Adopters)
            self.stdout.write('Creating adopter users...')
            adopters_data = [
                {'username': 'yamada_taro', 'password': 'user123', 'email': 'yamada@example.com'},
                {'username': 'sato_hanako', 'password': 'user123', 'email': 'sato@example.com'},
                {'username': 'tanaka_ichiro', 'password': 'user123', 'email': 'tanaka@example.com'},
                {'username': 'suzuki_yuki', 'password': 'user123', 'email': 'suzuki@example.com'},
                {'username': 'kobayashi_ai', 'password': 'user123', 'email': 'kobayashi@example.com'},
                {'username': 'watanabe_ken', 'password': 'user123', 'email': 'watanabe@example.com'},
                {'username': 'ito_mai', 'password': 'user123', 'email': 'ito@example.com'},
                {'username': 'nakamura_ryo', 'password': 'user123', 'email': 'nakamura@example.com'},
            ]

            for adopter_data in adopters_data:
                user, created = User.objects.get_or_create(
                    username=adopter_data['username'],
                    defaults={
                        'email': adopter_data['email'],
                        'user_type': 'adopter',
                    }
                )
                if created:
                    user.set_password(adopter_data['password'])
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Adopter: {adopter_data["username"]} / {adopter_data["password"]}'
                    ))

            self.stdout.write(self.style.SUCCESS('\n✅ Test data creation completed!'))
            self.stdout.write(self.style.WARNING('\nView login credentials in docs/test-accounts.md'))
