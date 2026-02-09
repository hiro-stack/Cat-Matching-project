# Heroku + Vercel デプロイガイド

## 📋 本番デプロイ要件

### 前提
- **docker-compose.yml**: 開発専用（本番要件に含めない）
- **永続データ**: マネージドサービスを使用
  - **DB**: Heroku Postgres
  - **メディア**: Cloudflare R2（S3互換）

---

## ✅ 完了した設定

### 1. Backend（Django API on Heroku）

#### ✅ プロジェクト構造
```
backend/
├── manage.py
├── Procfile
├── requirements.txt
├── .env.example
├── config/
│   ├── settings.py  # R2 設定済み
│   └── urls.py      # ヘルスチェック追加
├── accounts/
├── cats/
│   ├── upload.py    # Presigned URL API
│   └── urls.py
├── shelters/
└── applications/
```

#### ✅ Procfile
```
release: python manage.py migrate --no-input
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-file -
```

#### ✅ 環境変数（Heroku Config Vars）
- `SECRET_KEY`: 本番用秘密鍵
- `DEBUG`: False
- `ALLOWED_HOSTS`: Herokuドメイン
- `DATABASE_URL`: Heroku Postgres（自動設定）
- `FRONTEND_URL`: Vercel URL（CORS用）
- `USE_R2_STORAGE`: True
- `R2_ACCESS_KEY_ID`: R2 アクセスキー
- `R2_SECRET_ACCESS_KEY`: R2 シークレットキー
- `R2_BUCKET_NAME`: R2 バケット名
- `R2_ENDPOINT_URL`: R2 エンドポイント
- `R2_PUBLIC_DOMAIN`: カスタムドメイン（オプション）

#### ✅ Cloudflare R2 設定
- django-storages + boto3 で S3互換ストレージとして接続
- Presigned URL で直接アップロード可能
- エンドポイント: `/api/cats/upload/presigned/`

#### ✅ セキュリティ設定
- HTTPS強制（本番環境）
- Secure Cookie
- HSTS設定
- ファイルアップロードサイズ制限（10MB）

#### ✅ ヘルスチェック
- エンドポイント: `/healthz/`
- レスポンス: `{"status": "ok", "service": "cat-matching-api"}`

---

### 2. Frontend（Next.js Web on Vercel）

#### ✅ プロジェクト構造
```
frontend/
├── package.json
├── next.config.js   # API rewrites設定
├── vercel.json
├── .env.example
└── src/
    └── lib/
        └── api.ts   # JWT認証付きAPIクライアント
```

#### ✅ 環境変数（Vercel）
- `NEXT_PUBLIC_API_URL`: Heroku API URL

#### ✅ Vercel 設定
- Root Directory: `frontend/`
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

---

## 🚀 デプロイ手順

### Step 1: Cloudflare R2 の準備

1. **Cloudflare R2 バケット作成**
   ```bash
   # Cloudflare Dashboard > R2 > Create bucket
   ```

2. **API トークン作成**
   ```bash
   # R2 > Manage R2 API Tokens > Create API Token
   # Permissions: Object Read & Write
   ```

3. **エンドポイント URL を確認**
   ```
   https://<account_id>.r2.cloudflarestorage.com
   ```

4. **（オプション）カスタムドメイン設定**
   ```bash
   # R2 バケット > Settings > Public Access > Custom Domains
   # 例: media.example.com
   ```

---

### Step 2: Heroku へのデプロイ

#### 1. Heroku アプリ作成
```bash
# Heroku CLIをインストール済みの場合
heroku login
heroku create your-app-name
```

#### 2. Heroku Postgres 追加
```bash
heroku addons:create heroku-postgresql:essential-0 -a your-app-name
```

#### 3. 環境変数設定
```bash
cd backend

# Django基本設定
heroku config:set SECRET_KEY="$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" -a your-app-name
heroku config:set DEBUG=False -a your-app-name
heroku config:set ALLOWED_HOSTS="your-app-name.herokuapp.com" -a your-app-name
heroku config:set HEROKU_APP_NAME="your-app-name" -a your-app-name

# CORS設定（Vercel URLは後で設定）
heroku config:set FRONTEND_URL="https://your-app.vercel.app" -a your-app-name

# Cloudflare R2設定
heroku config:set USE_R2_STORAGE=True -a your-app-name
heroku config:set R2_ACCESS_KEY_ID="your-access-key-id" -a your-app-name
heroku config:set R2_SECRET_ACCESS_KEY="your-secret-access-key" -a your-app-name
heroku config:set R2_BUCKET_NAME="your-bucket-name" -a your-app-name
heroku config:set R2_ENDPOINT_URL="https://<account_id>.r2.cloudflarestorage.com" -a your-app-name

# カスタムドメイン（オプション）
# heroku config:set R2_PUBLIC_DOMAIN="media.example.com" -a your-app-name
```

#### 4. デプロイ
```bash
# リポジトリのルートから
git add .
git commit -m "Add Heroku deployment configuration"

# backend/ をサブディレクトリとしてデプロイ
git subtree push --prefix backend heroku main

# または、Heroku Git remote を設定している場合
# git push heroku main
```

#### 5. 確認
```bash
heroku logs --tail -a your-app-name
heroku open -a your-app-name
curl https://your-app-name.herokuapp.com/healthz/
```

---

### Step 3: Vercel へのデプロイ

#### 1. Vercel プロジェクト作成

**Vercel Dashboard から:**
1. https://vercel.com/new にアクセス
2. GitHub リポジトリを選択
3. **Root Directory** を `frontend/` に設定
4. **Framework Preset**: Next.js
5. **Build Command**: `npm run build`
6. **Output Directory**: `.next`

#### 2. 環境変数設定

Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-app-name.herokuapp.com` | Production, Preview, Development |

#### 3. デプロイ

```bash
# 自動デプロイ（GitHubと連携済み）
git push origin main

# または Vercel CLI を使用
npm install -g vercel
cd frontend
vercel --prod
```

#### 4. 確認

```bash
# Vercel URL を確認
# https://your-app.vercel.app

# ブラウザでアクセス
open https://your-app.vercel.app
```

---

### Step 4: CORS 設定の更新

Vercel のデプロイが完了したら、Heroku の `FRONTEND_URL` を更新：

```bash
heroku config:set FRONTEND_URL="https://your-app.vercel.app" -a your-app-name
```

---

## 🔍 デプロイ後の確認

### Backend（Heroku）チェックリスト

- [ ] ヘルスチェックが成功: `curl https://your-app.herokuapp.com/healthz/`
- [ ] 管理画面にアクセス可能: `https://your-app.herokuapp.com/django-admin/`
- [ ] API ドキュメント表示: `https://your-app.herokuapp.com/api/docs/`
- [ ] DATABASE_URL が設定されている: `heroku config:get DATABASE_URL`
- [ ] マイグレーションが実行されている: `heroku logs --tail`

### Frontend（Vercel）チェックリスト

- [ ] ビルドが成功している: Vercel Dashboard > Deployments
- [ ] 環境変数が設定されている: `NEXT_PUBLIC_API_URL`
- [ ] ブラウザでアクセス可能: `https://your-app.vercel.app`

### CORS チェックリスト

- [ ] Heroku の `FRONTEND_URL` が Vercel URL に設定されている
- [ ] ブラウザの開発者ツールで CORS エラーがない

---

## 📁 ファイルアップロードの使用方法

### Presigned URL でのアップロード

#### 1. アップロード URL を取得
```javascript
// Frontend (Next.js)
const response = await fetch('https://your-app.herokuapp.com/api/cats/upload/presigned/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    file_name: 'cat.jpg',
    file_type: 'image/jpeg',
    file_category: 'image'
  })
});

const { presigned_url, fields, file_key, public_url } = await response.json();
```

#### 2. R2 へ直接アップロード
```javascript
const formData = new FormData();
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append('file', fileBlob);

await fetch(presigned_url, {
  method: 'POST',
  body: formData,
});
```

#### 3. メタ情報を API に登録
```javascript
await fetch('https://your-app.herokuapp.com/api/cats/1/images/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    image_url: public_url,
    file_key: file_key,
    caption: 'かわいい猫'
  })
});
```

---

## 🔧 トラブルシューティング

### Heroku デプロイエラー

```bash
# ログ確認
heroku logs --tail -a your-app-name

# よくあるエラー
# - "No module named 'xxx'": requirements.txt に追加
# - "Database connection error": DATABASE_URL を確認
# - "Static files not found": collectstatic を確認
```

### Vercel ビルドエラー

```bash
# Vercel Dashboard > Deployments > Build Logs を確認

# よくあるエラー
# - "Module not found": npm install 確認
# - "Build failed": next.config.js の構文エラー
# - "Environment variable undefined": Vercel 環境変数を確認
```

### CORS エラー

```bash
# Django側の設定確認
heroku config:get FRONTEND_URL -a your-app-name

# ブラウザの開発者ツールで確認
# Network > Response Headers > Access-Control-Allow-Origin
```

---

## 📊 監視・運用

### ログ監視

**Heroku:**
```bash
heroku logs --tail -a your-app-name
```

**Vercel:**
- Vercel Dashboard > Logs

### パフォーマンス監視

- Heroku Metrics (Dashboard)
- Vercel Analytics
- Cloudflare R2 Metrics

---

## 🔐 セキュリティベストプラクティス

- ✅ 秘密情報は環境変数で管理（コミット禁止）
- ✅ DEBUG=False（本番環境）
- ✅ HTTPS 強制
- ✅ CORS を本番ドメインのみに制限
- ✅ ファイルアップロードサイズ制限
- ✅ 管理画面のアクセス制限検討

---

## 📚 参考リンク

- [Heroku Django デプロイガイド](https://devcenter.heroku.com/articles/django-app-configuration)
- [Vercel Next.js デプロイ](https://vercel.com/docs/frameworks/nextjs)
- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/)
- [django-storages S3 設定](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)
