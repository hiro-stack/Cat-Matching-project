"""
Django management command to create test data for the cat matching application.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from shelters.models import Shelter
from cats.models import Cat
import random


class Command(BaseCommand):
    help = 'Create test data for development and demo purposes'

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
                    'staff': []
                },
                {
                    'username': 'new_shelter',
                    'password': 'shelter123',
                    'name': '新規保護団体',
                    'email': 'new@shelter.org',
                    'verification_status': 'pending',
                    'description': '申請中の新しい団体です。',
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
                    user=user,
                    defaults={
                        'name': shelter_data['name'],
                        'description': shelter_data['description'],
                        'verification_status': shelter_data['verification_status'],
                    }
                )
                shelters.append(shelter)

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
                            'shelter_role': 'staff',
                        }
                    )
                    if created:
                        staff_user.set_password(staff_data['password'])
                        staff_user.save()
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
                    human_distance=random.choice(['cuddly', 'ok', 'shy']),
                    activity_level=random.choice(['active', 'normal', 'calm']),
                    personality=f'{name}はとても可愛い猫です。',

                    # Transfer info
                    interview_format=random.choice(['offline', 'online', 'both']),
                    trial_period='2週間',
                    transfer_fee=random.choice([0, 10000, 15000, 20000]),
                    fee_details='ワクチン接種費用として',

                    description=f'{name}は{shelter.name}で保護された猫です。新しい家族を探しています。',
                    status='open',
                    is_public=True,
                )

                self.stdout.write(f'✓ Cat: {cat.name} ({shelter.name})')

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
