# マッチングアプリ 改修計画書

> 作成日: 2026-02-17  
> 最終更新: 2026-02-17  
> 対象: 保護猫マッチングアプリ (Django REST Framework + Next.js)

---

## 実装完了状況

### ✅ Phase 1: 冪等化 + 状態マシン + 競合防止

| 改修                     | ファイル                      | 内容                                                                       | 状態    |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------------- | ------- |
| 応募の冪等化             | `applications/views.py`       | `select_for_update()` で競合防止、レスポンスに `status`, `updated_at` 追加 | ✅ 完了 |
| 状態マシン               | `applications/serializers.py` | `ALLOWED_TRANSITIONS` マップにより不正遷移を防止                           | ✅ 完了 |
| ステータス更新の競合防止 | `applications/views.py`       | `update_status` に `transaction.atomic` + `select_for_update`              | ✅ 完了 |
| レスポンス統一           | `applications/views.py`       | `allowed_actions` を含む統一フォーマットでレスポンス                       | ✅ 完了 |

**状態遷移マップ:**

```
pending → reviewing → trial → accepted
                ↓         ↓
            rejected   rejected
                ↓         ↓
            cancelled  cancelled
```

### ✅ Phase 2: メール送信の信頼性向上

| 改修             | ファイル                                              | 内容                                      | 状態    |
| ---------------- | ----------------------------------------------------- | ----------------------------------------- | ------- |
| EmailLog モデル  | `accounts/models.py`                                  | 全メール送信を追跡するモデル              | ✅ 完了 |
| 追跡可能な送信   | `accounts/email_utils.py`                             | `send_tracked_email()` ユーティリティ関数 | ✅ 完了 |
| 既存メール置換   | `accounts/views.py`                                   | 団体登録通知 + パスワードリセットを置換   | ✅ 完了 |
| 管理画面         | `accounts/admin.py`                                   | EmailLog の読み取り専用管理画面           | ✅ 完了 |
| リトライコマンド | `accounts/management/commands/retry_failed_emails.py` | 失敗メールの再送信管理コマンド            | ✅ 完了 |

### ✅ Phase 3: 権限昇格の分離 + 団体承認メール通知

| 改修                   | ファイル            | 内容                                                       | 状態    |
| ---------------------- | ------------------- | ---------------------------------------------------------- | ------- |
| 承認時の権限昇格       | `shelters/views.py` | `verify` アクション: 承認時に `user_type='shelter'` に昇格 | ✅ 完了 |
| 承認通知メール         | `shelters/views.py` | 承認時に団体管理者にメール通知（EmailLog経由）             | ✅ 完了 |
| 否認通知メール         | `shelters/views.py` | 否認/修正依頼時にメール通知                                | ✅ 完了 |
| プロフィールに申請状態 | `accounts/views.py` | `UserProfileView` に `shelter_status` を追加               | ✅ 完了 |

### ✅ Phase 5: フロントエンド改修

| 改修           | ファイル                             | 内容                                                        | 状態    |
| -------------- | ------------------------------------ | ----------------------------------------------------------- | ------- |
| 型の更新       | `types/index.ts`                     | `ApplicationStatus` に `trial` を追加                       | ✅ 完了 |
| サービス更新   | `services/applications.ts`           | `StatusUpdateResponse` 型 + `updateStatus` 戻り値型を厳密化 | ✅ 完了 |
| 最新状態再取得 | `shelter/applications/[id]/page.tsx` | ステータス更新前に最新状態をGET、古い状態での処理を防止     | ✅ 完了 |
| ボタンスピナー | `shelter/applications/[id]/page.tsx` | ステータス更新ボタンにローディングスピナー + disabled       | ✅ 完了 |
| エラー表示改善 | `shelter/applications/[id]/page.tsx` | バリデーションエラー時に具体的な遷移情報を表示              | ✅ 完了 |

### ✅ Phase 6: 監査ログ

| 改修            | ファイル             | 内容                              | 状態    |
| --------------- | -------------------- | --------------------------------- | ------- |
| AuditLog モデル | `accounts/models.py` | モデル名+ID+変更内容+実行者を記録 | ✅ 完了 |
| 管理画面        | `accounts/admin.py`  | 読み取り専用の監査ログ管理画面    | ✅ 完了 |

---

## マイグレーション手順

ローカルに MySQL クライアントがないため、Docker 環境で実行してください:

```bash
# Docker Compose で起動（マイグレーション自動実行）
docker compose up --build

# または手動でマイグレーション
docker compose exec backend python manage.py makemigrations accounts --name add_emaillog_auditlog
docker compose exec backend python manage.py migrate
```

---

## 未実装（将来対応）

| Phase | 内容                                         | 備考                                  |
| ----- | -------------------------------------------- | ------------------------------------- |
| 2.5   | Celeryによる非同期メール送信                 | 現在は同期送信 + 管理コマンドリトライ |
| 4     | 画像アップロード `client_upload_id` 冪等化   | CatImageモデルにフィールド追加が必要  |
| 4     | フロントの画像事前チェック（サイズ・拡張子） | 既存の動作に問題がないため優先度低    |
| 7     | SPF/DKIM/DMARC 設定                          | DNS/インフラ側の設定                  |
| 7     | AuditLog の自動記録 Mixin                    | 各モデルの save() に差し込む仕組み    |

---

## メール失敗リトライの使い方

```bash
# 失敗メールを再送信（最大3回）
docker compose exec backend python manage.py retry_failed_emails

# リトライ回数を指定
docker compose exec backend python manage.py retry_failed_emails --max-retries 5
```
