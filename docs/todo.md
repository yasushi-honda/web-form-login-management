# TODO

## TODOリスト

- [x] ログイン管理ロジック実装
- [x] API連携（login.html→GAS doPost）
- [x] GAS Webアプリとして画面・API一体運用に設計変更
- [x] ログイン認証テスト実装・動作確認
- [x] ドキュメント整理・進捗反映
- [x] サインアップ（新規ユーザー登録）機能の実装
  - [x] サインアップ画面（signup.html）の作成
  - [x] registerNewUser APIとの連携
  - [x] 登録成功時のID/PW表示機能
  - [x] テスト・動作確認
- [ ] 自動ログイン機能の実装
  - [ ] セッションIDのLocalStorage保存機能
  - [ ] 自動ログインフラグのデータベース反映
  - [ ] セッションによる認証機能
  - [ ] テスト・動作確認
- [ ] フォーム生成機能の実装
- [x] サインアップ後のログイン画面遷移404エラー対応
  - [x] redirectToLogin関数にクエリパラメータ「?page=login」を付与するよう修正
  - [x] signup.htmlのログイン画面遷移処理をURLリダイレクト方式からHTML直接取得方式に変更
  - [x] getLoginPage関数を修正し、HTMLコンテンツを文字列として返すように変更

---

## 設計・実装方針（2025/04/23更新）
- ログイン画面（login.html）はGASのHTMLサービスでホストし、WebアプリURL（/exec）で直接アクセスできるようにした。
- 認証APIも同一URLで提供し、画面・APIの一元管理・CORS問題の完全回避を実現。
- GASのHTMLサービスでは、fetchではなく**google.script.run**を使ってサーバーサイド関数を直接呼び出す必要がある。
- サーバーサイド関数はトップレベルで定義し、クライアントからは`google.script.run.functionName()`の形で呼び出す。
- 今後もGAS Webアプリ内でUI・認証ロジック・APIを一体運用する方針。

## 実装で得られた知見（2025/04/23）

### GASのHTMLサービスとサーバーサイド関数の連携
- `google.script.run`でサーバーサイド関数を呼び出す際、複雑なオブジェクト（Dateオブジェクトなど）は正しく伝達されない場合がある。
- サーバー側では返却値を単純なオブジェクトに変換し、複雑な型は文字列化（`String()`）すると良い。
- クライアント側では結果の型チェックと適切な変換を行い、文字列比較（`String(result.success) === 'true'`）で判定すると安全。

### エラーハンドリングの重要性
- クライアント側とサーバー側の両方で詳細なログ出力と例外処理を実装することで、デバッグと問題解決が容易になる。
- 全体をtry-catchで囲み、予期せぬエラーにも対応することが重要。

### GASのHTMLサービスでの画面遷移
- 画面間の遷移には`window.location.href`ではなく`google.script.run`を使用する必要がある。
- 遷移先の画面のHTMLを取得し、`document.write()`で書き換えることで実現する。
- 画面遷移時にはボタンの無効化など、重複クリック防止の対策が必要。
- GASのWebアプリでは、HTMLファイルを直接参照せず、常にエンドポイント（/exec）経由でアクセスする必要がある。
- ページ遷移時には`?page=ページ名`のようなクエリパラメータを付与して、doGet側で適切なHTMLを返すことが重要。

### GASのWebアプリでの画面遷移の実装方法（2025/04/23追記）

画面遷移には主に以下の2つの方法があります：

1. **HTMLコンテンツ直接取得方式**
   ```javascript
   google.script.run
     .withSuccessHandler(function(htmlContent) {
       document.open();
       document.write(htmlContent);
       document.close();
     })
     .getXxxPage(); // ページ取得関数
   ```
   - メリット：ページ遷移がスムーズで、リダイレクトによる余分なリクエストがない
   - 注意点：サーバー側の関数は文字列としてHTMLコンテンツを返す必要がある

2. **URLリダイレクト方式**
   ```javascript
   google.script.run
     .withSuccessHandler(function(redirectUrl) {
       window.top.location.href = redirectUrl;
     })
     .redirectToXxx(); // リダイレクトURL取得関数
   ```
   - メリット：URL履歴が正しく更新される
   - 注意点：クエリパラメータを正しく付与し、doGet側で適切にハンドリングする必要がある

## テスト観点
- WebアプリURLでログイン画面が正しく表示されること
- ID/PW認証APIが正常・異常系ともに正しく動作すること
- 画面・API連携にCORS等の問題が発生しないこと
