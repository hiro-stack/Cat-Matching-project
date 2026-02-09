# Vercel デプロイ手順

Vercel は GUI からのデプロイを推奨します。

## 手順

### 1. Vercel Dashboard にアクセス
https://vercel.com/new

### 2. GitHub リポジトリを選択
- このリポジトリを選択
- または Import Git Repository

### 3. プロジェクト設定

#### Framework Preset
- **Next.js** を選択（自動検出されるはず）

#### Root Directory
- `frontend/` を指定 ⚠️ **重要**

#### Build Settings
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）

### 4. 環境変数を設定

**Environment Variables** セクションで以下を追加：

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://your-app-name.herokuapp.com` | Production, Preview, Development |

⚠️ **重要**: Heroku のアプリ名に置き換えてください

### 5. Deploy ボタンをクリック

デプロイが開始されます（約2-3分）

### 6. デプロイ完了後

デプロイが完了したら：

1. **Vercel URL を確認**
   - 例: `https://your-project.vercel.app`

2. **Heroku の FRONTEND_URL を更新**
   ```bash
   heroku config:set FRONTEND_URL="https://your-project.vercel.app" -a your-app-name
   ```

3. **動作確認**
   - Vercel URL にアクセス
   - ブラウザの開発者ツールで CORS エラーがないか確認

## Vercel CLI を使う場合（オプション）

```bash
# Vercel CLI をインストール
npm install -g vercel

# frontend ディレクトリに移動
cd frontend

# ログイン
vercel login

# デプロイ（本番環境）
vercel --prod

# 環境変数を設定
vercel env add NEXT_PUBLIC_API_URL production
# 値を入力: https://your-app-name.herokuapp.com
```

## トラブルシューティング

### Root Directory が正しく設定されていない場合

Vercel Dashboard > Settings > General > Root Directory を `frontend/` に変更

### ビルドエラーが発生した場合

1. Vercel Dashboard > Deployments > Build Logs を確認
2. `package.json` の依存関係を確認
3. 環境変数が正しく設定されているか確認

### API 接続エラー

1. `NEXT_PUBLIC_API_URL` が正しく設定されているか確認
2. Heroku の `FRONTEND_URL` が Vercel URL に設定されているか確認
3. ブラウザの開発者ツールで Network タブを確認
