# web-form-login-management

Google Apps Script を TypeScript + clasp で管理する Web フォームログイン管理システム。

## 機能概要

- ユーザー登録・認証機能
- テンプレートフォームからのユーザー専用フォーム自動生成
- フォーム一覧表示機能
- 自動ログイン機能

## 開発環境構築

1. Node.js をインストール
2. npm install
3. clasp login
4. clasp create --rootDir src --type standalone

## ディレクトリ構成

```
.
├ .clasp.json
├ README.md
├ .gitignore
├ package.json
├ tsconfig.json
├ src/              # ソースコード
│ ├ authService.js     # 認証サービス機能
│ ├ formGenerate.html  # フォーム生成画面
│ ├ formList.html      # フォーム一覧画面
│ ├ formManagement.js  # フォーム管理機能
│ ├ login.html         # ログイン画面
│ ├ signup.html        # サインアップ画面
│ ├ test.js            # テスト用関数
│ ├ userManagement.js  # ユーザー管理機能
│ └ utils.js           # ユーティリティ関数
└ docs/             # ドキュメント
  ├ 設計.md
  ├ サインアップ機能設計.md
  ├ 自動ログイン機能設計.md
  ├ GAS画面遷移実装ガイド.md
  └ フォーム複製機能実装メモ.md
```

## 実装済み機能

### 1. ユーザー登録・認証機能
- メールアドレスでの新規ユーザー登録
- ID/パスワードによる認証
- セッション管理
- 永続トークンによる自動ログイン機能
  - ローディングインジケータ付きのユーザーフレンドリーUI

### 2. フォーム管理機能
- テンプレートフォームからユーザー専用フォームの自動生成
- ユーザーにフォームの編集権限を付与
- フォーム一覧の取得と表示

## 注意点

### フォーム複製の正しい実装方法

Google Forms APIでフォームを複製する際は、以下の方法を使用します：

```javascript
// DriveAppを使用してフォームを複製
// FormApp.openById(id).copy() や templateForm.createNewFormFromTemplate() は存在しない

const templateFile = DriveApp.getFileById(templateId);
const newFile = templateFile.makeCopy(newFormTitle);
const formId = newFile.getId();

// 複製したフォームを開く
const newForm = FormApp.openById(formId);
const formUrl = newForm.getPublishedUrl();
```

### 本番運用時のマスターフォーム管理

- マスターとなるGoogleフォームは管理ユーザーが別途作成し、システムに登録する運用とする
- テスト環境では自動生成したテンプレートフォームを使用可能

## 今後の開発予定

- フォームボタン機能の実装
- ユーザー管理機能の拡張
- 自動ログイン機能のセキュリティ強化（トークンの期限設定など）
- ローディングインジケータのアニメーション改善
