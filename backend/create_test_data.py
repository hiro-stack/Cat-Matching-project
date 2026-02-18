#!/usr/bin/env python
"""テストデータを作成するスクリプト（Shelter統一版）"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from shelters.models import Shelter, ShelterUser
from cats.models import Cat
from applications.models import Application

User = get_user_model()

def create_test_data():
    print("テストデータを作成中...")
    
    # 1. スーパーユーザーを作成
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            user_type='admin'
        )
        print(f"✓ 管理者ユーザーを作成しました: {admin.username}")
    
    # 2. 保護団体を作成
    if not Shelter.objects.filter(name='東京保護猫の会').exists():
        shelter = Shelter.objects.create(
            name='東京保護猫の会',
            representative='山田太郎',
            website_url='https://example.com',
            address='東京都渋谷区渋谷1-1-1',
            phone='03-1234-5678',
            registration_number='NPO-12345',
            description='東京都内で保護猫活動を行っています。',
            public_profile_enabled=True,
            verification_status='approved'
        )
        print(f"✓ 保護団体を作成しました: {shelter.name}")
        
        # 3. 保護団体スタッフユーザーを作成
        if not User.objects.filter(username='shelter1').exists():
            shelter_user = User.objects.create_user(
                username='shelter1',
                email='shelter1@example.com',
                password='shelter123',
                user_type='shelter',
                phone_number='03-1234-5678',
                address='東京都渋谷区'
            )
            print(f"✓ 保護団体スタッフユーザーを作成しました: {shelter_user.username}")
            
            # 4. 保護団体とユーザーを紐付け
            ShelterUser.objects.create(
                shelter=shelter,
                user=shelter_user,
                role='admin',
                is_active=True
            )
            print("✓ 保護団体とユーザーを紐付けました")
    else:
        shelter = Shelter.objects.get(name='東京保護猫の会')
    
    # 5. 飼い主希望者ユーザーを作成
    if not User.objects.filter(username='adopter1').exists():
        adopter = User.objects.create_user(
            username='adopter1',
            email='adopter1@example.com',
            password='adopter123',
            user_type='adopter',
            phone_number='090-1234-5678',
            address='東京都新宿区'
        )
        print(f"✓ 飼い主希望者ユーザーを作成しました: {adopter.username}")
    
    # 6. 保護猫を作成
    if not Cat.objects.filter(name='たま').exists():
        cat1 = Cat.objects.create(
            shelter=shelter,
            name='たま',
            gender='female',
            age_years=2,
            age_months=3,
            breed='雑種',
            size='medium',
            color='三毛',
            personality='人懐っこくて甘えん坊です。',
            health_status='健康状態良好',
            vaccination=True,
            neutered=True,
            description='とても可愛い三毛猫です。家族を探しています。',
            status='open',
            is_public=True
        )
        print(f"✓ 保護猫を作成しました: {cat1.name}")
        
        cat2 = Cat.objects.create(
            shelter=shelter,
            name='クロ',
            gender='male',
            age_years=1,
            age_months=6,
            breed='雑種',
            size='small',
            color='黒',
            personality='元気で遊び好きです。',
            health_status='健康状態良好',
            vaccination=True,
            neutered=False,
            description='活発な黒猫の男の子です。',
            status='open',
            is_public=True
        )
        print(f"✓ 保護猫を作成しました: {cat2.name}")
    
    print("\n✅ テストデータの作成が完了しました！")
    print("\n【データ構造】")
    print("  Shelter (保護団体) ← 団体情報の正")
    print("    ├─ ShelterUser (団体メンバー)")
    print("    │   └─ User (user_type='shelter') ← スタッフのログインアカウント")
    print("    ├─ Cat (保護猫)")
    print("    └─ Application (応募)")
    print("\n管理画面にログイン:")
    print("  URL: http://localhost:8000/admin/")
    print("  ユーザー名: admin")
    print("  パスワード: admin123")
    print("\nフロントエンドにログイン:")
    print("  保護団体スタッフ: shelter1 / shelter123")
    print("  飼い主希望者: adopter1 / adopter123")

if __name__ == '__main__':
    create_test_data()
