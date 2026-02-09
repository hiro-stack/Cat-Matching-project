# テストアカウント一覧

このドキュメントには、開発・デモ用に生成されたテストアカウントの認証情報が記載されています。

## 🔑 ログイン URL

- **フロントエンド:** https://cat-maching.vercel.app/login
- **Django Admin:** https://cat-matching-api-536a07c2b81c.herokuapp.com/django-admin/

---

## 👑 スーパーユーザー（管理者）

Django Admin へのフルアクセス権限を持つアカウント。

| ユーザー名 | パスワード | メール | 権限 |
|-----------|-----------|--------|------|
| `admin` | `admin123` | admin@example.com | 全権限 |

**用途:** Django Admin での全データ管理、ユーザー管理、団体承認など

---

## 🏠 保護団体アカウント

### 承認済み団体（is_public=True で猫を公開可能）

#### 1. 猫の心保護団体
- **ユーザー名:** `neko_heart`
- **パスワード:** `shelter123`
- **メール:** info@nekoheart.org
- **ステータス:** 承認済み (approved)
- **説明:** 東京都を中心に保護猫の譲渡活動を行っています

**スタッフ:**
- `neko_staff1` / `staff123`
- `neko_staff2` / `staff123`

---

#### 2. ハッピーキャッツ
- **ユーザー名:** `happy_cats`
- **パスワード:** `shelter123`
- **メール:** contact@happycats.jp
- **ステータス:** 承認済み (approved)
- **説明:** 大阪で活動する保護猫カフェ併設の団体です

**スタッフ:**
- `happy_staff1` / `staff123`

---

#### 3. キャットレスキュー福岡
- **ユーザー名:** `cat_rescue`
- **パスワード:** `shelter123`
- **メール:** info@catrescue-fukuoka.org
- **ステータス:** 承認済み (approved)
- **説明:** 福岡県内の保護猫を中心に活動しています

**スタッフ:** なし

---

### 未承認団体（テスト用）

#### 4. 新規保護団体
- **ユーザー名:** `new_shelter`
- **パスワード:** `shelter123`
- **メール:** new@shelter.org
- **ステータス:** 審査中 (pending)
- **説明:** 申請中の新しい団体です
- **制限:** 猫を公開 (is_public=True) に設定できません

---

## 👤 一般ユーザー（里親希望者）

すべてのパスワードは `user123` です。

| ユーザー名 | パスワード | メール | ユーザータイプ |
|-----------|-----------|--------|--------------|
| `yamada_taro` | `user123` | yamada@example.com | adopter |
| `sato_hanako` | `user123` | sato@example.com | adopter |
| `tanaka_ichiro` | `user123` | tanaka@example.com | adopter |
| `suzuki_yuki` | `user123` | suzuki@example.com | adopter |
| `kobayashi_ai` | `user123` | kobayashi@example.com | adopter |
| `watanabe_ken` | `user123` | watanabe@example.com | adopter |
| `ito_mai` | `user123` | ito@example.com | adopter |
| `nakamura_ryo` | `user123` | nakamura@example.com | adopter |

**用途:** 猫の閲覧、お気に入り登録、譲渡申請など

---

## 🐱 登録済みの猫

約15匹の猫が承認済み団体に登録されています:

**猫の名前例:**
- たま、ミケ、クロ、シロ、トラ、チビ、モモ、サクラ
- ハナ、ソラ、ユキ、コタロウ、ハチ、レオ、ルナ

**特徴:**
- ランダムな品種、毛色、性格
- 健康情報（ワクチン、不妊去勢など）が設定済み
- すべて公開状態 (is_public=True, status='open')

---

## 📝 テストシナリオ

### 1. 保護団体としてログイン
1. `neko_heart` / `shelter123` でログイン
2. `/shelter/dashboard` にリダイレクト
3. 登録されている猫の一覧を確認
4. 新しい猫を登録してみる

### 2. 一般ユーザーとしてログイン
1. `yamada_taro` / `user123` でログイン
2. 猫の一覧ページで検索・フィルタリング
3. 猫の詳細ページを閲覧
4. プロフィール設定を完了させる

### 3. 管理者としてログイン
1. Django Admin に `admin` / `admin123` でログイン
2. 団体の承認ステータスを変更
3. ユーザー管理
4. 猫のデータ編集

---

## ⚠️ セキュリティ注意事項

- **これらは開発・デモ用のテストアカウントです**
- **本番環境では絶対に使用しないでください**
- 本番環境では強力なパスワードを設定し、定期的に変更してください
- このファイルは `.gitignore` に追加することを推奨します

---

## 🔄 データの再生成

テストデータを再生成する場合:

```bash
# Heroku
heroku run python manage.py create_test_data -a cat-matching-api

# ローカル
python manage.py create_test_data
```

**注意:** 既存のデータと重複する場合は、既存データが優先されます（`get_or_create` を使用）。

---

生成日: 2026-02-10
