# フロントエンド技術仕様書 (Frontend Specifications)

## ドキュメント一覧 (Pages)

各機能ページのUI/UX仕様、画面レイアウト、および実装の詳細については、以下の個別ドキュメントを参照してください。

| 機能/ページ              | ファイル名                                                 | 概要                                             |
| :----------------------- | :--------------------------------------------------------- | :----------------------------------------------- |
| **保護猫一覧**           | [cats_list_page.md](./cats_list_page.md)                   | 検索、フィルタリング、カード表示、無限スクロール |
| **猫詳細**               | [cat_detail_page.md](./cat_detail_page.md)                 | 写真ギャラリー、応募フォーム、権限別アクション   |
| **認証 (ログイン/登録)** | [auth_pages.md](./auth_pages.md)                           | ログイン、ウィザード形式の新規登録               |
| **応募・チャット**       | [applications_chat_pages.md](./applications_chat_pages.md) | 応募管理、メッセージング、ステータス変更         |
| **マイページ**           | [profile_page.md](./profile_page.md)                       | プロフィール閲覧・編集、ログアウト               |

---

## 共通仕様 (Common)

- **API通信・SWR戦略**: [01_api_communication.md](./pages/01_api_communication.md)
- **UIコンポーネント・デザインシステム**: [02_ui_components.md](./pages/02_ui_components.md) (Designed with **Tailwind CSS**)
