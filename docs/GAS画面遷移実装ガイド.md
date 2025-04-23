# GAS Webアプリでの画面遷移実装ガイド

## 概要

Google Apps Script（GAS）のWebアプリケーション環境では、通常のWebアプリケーションとは異なる画面遷移の実装方法が必要です。このドキュメントでは、GAS Webアプリでの画面遷移の実装方法と注意点について説明します。

## GAS Webアプリの特徴

GASのWebアプリケーションには以下の特徴があります：

1. HTMLファイルは静的ファイルとして直接公開されず、常にエンドポイント（`/exec`）経由でアクセスする必要がある
2. クライアントサイドからサーバーサイド関数を直接呼び出すには`google.script.run`を使用する
3. サーバーサイドでは`HtmlService`を使用してHTMLを生成・返却する

## 画面遷移の実装方法

GAS Webアプリでの画面遷移には、主に以下の2つの方法があります：

### 1. HTMLコンテンツ直接取得方式

この方法では、サーバーサイドからHTMLコンテンツを文字列として取得し、現在のページ内容を直接書き換えます。

#### クライアントサイド実装例（JavaScript）

```javascript
document.getElementById('linkToPage').addEventListener('click', function(e) {
  e.preventDefault();
  // ボタンを無効化して重複クリックを防止
  this.disabled = true;
  
  google.script.run
    .withSuccessHandler(function(htmlContent) {
      console.log('HTMLコンテンツを受け取りました');
      // 現在のページ内容を置き換え
      document.open();
      document.write(htmlContent);
      document.close();
    })
    .withFailureHandler(function(error) {
      console.error('画面遷移エラー:', error);
      alert('画面遷移中にエラーが発生しました');
      document.getElementById('linkToPage').disabled = false;
    })
    .getTargetPage(); // ページ取得関数
});
```

#### サーバーサイド実装例（GAS）

```javascript
/**
 * 対象ページのHTMLを取得する関数
 * @return {string} 対象ページのHTMLソース
 */
function getTargetPage() {
  console.log('対象ページの取得を開始');
  
  try {
    // HTMLファイルの内容を取得
    var htmlOutput = HtmlService.createHtmlOutputFromFile('targetPage');
    
    // サンドボックスモードとタイトルを設定
    htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
    htmlOutput.setTitle('アプリケーションタイトル');
    
    // HTMLコンテンツを文字列として取得
    var htmlContent = htmlOutput.getContent();
    
    console.log('対象ページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('対象ページの取得中にエラーが発生:', error);
    throw new Error('対象ページの取得に失敗しました: ' + error.message);
  }
}
```

#### メリット
- ページ遷移がスムーズで、リダイレクトによる余分なリクエストがない
- 単一ページアプリケーション（SPA）のような体験を提供できる

#### 注意点
- サーバー側の関数は文字列としてHTMLコンテンツを返す必要がある
- ブラウザの履歴が更新されない
- `document.write()`の使用には注意が必要（タイミングによっては既存のDOMを破壊する可能性がある）

### 2. URLリダイレクト方式

この方法では、サーバーサイドからリダイレクト先のURLを取得し、ブラウザのロケーションを変更します。

#### クライアントサイド実装例（JavaScript）

```javascript
document.getElementById('linkToPage').addEventListener('click', function(e) {
  e.preventDefault();
  // ボタンを無効化して重複クリックを防止
  this.disabled = true;
  
  google.script.run
    .withSuccessHandler(function(redirectUrl) {
      if (redirectUrl) {
        console.log('リダイレクト先URLを受け取りました:', redirectUrl);
        window.top.location.href = redirectUrl;
      } else {
        console.log('ページを再読み込みします');
        window.top.location.reload();
      }
    })
    .withFailureHandler(function(error) {
      console.error('画面遷移エラー:', error);
      alert('画面遷移中にエラーが発生しました');
      document.getElementById('linkToPage').disabled = false;
    })
    .redirectToTargetPage(); // リダイレクトURL取得関数
});
```

#### サーバーサイド実装例（GAS）

```javascript
/**
 * 対象画面へのリダイレクトを処理する関数
 * @return {string} リダイレクト先URL
 */
function redirectToTargetPage() {
  console.log('対象画面へのリダイレクトを処理します');
  
  try {
    // スクリプトのURLを取得
    var scriptUrl = ScriptApp.getService().getUrl();
    console.log('スクリプトURL:', scriptUrl);
    
    // クエリパラメータを除去してベースURLを取得
    var baseUrl = scriptUrl.split('?')[0];
    
    // 対象画面を表示するためのクエリパラメータを追加
    var targetUrl = baseUrl + '?page=targetPage';
    
    console.log('対象画面へのリダイレクトURL:', targetUrl);
    return targetUrl;
  } catch (error) {
    console.error('リダイレクトURLの取得中にエラーが発生:', error);
    // エラーの場合は空の文字列を返す
    return '';
  }
}
```

#### doGet関数の実装例

```javascript
/**
 * リクエストに応じて適切なHTMLページを返すエンドポイント
 * @param {Object} e - リクエストパラメータ
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  // リクエストパラメータの取得
  var params = e ? e.parameter : {};
  var page = params.page || '';
  
  // HTMLサービスの設定を調整
  var htmlOutput;
  
  // ページに応じて適切なHTMLを返却
  if (page === 'targetPage') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('targetPage');
  } else {
    // デフォルトはホーム画面
    htmlOutput = HtmlService.createHtmlOutputFromFile('home');
  }
  
  // サンドボックスモードとタイトルを設定
  htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  htmlOutput.setTitle('アプリケーションタイトル');
  
  return htmlOutput;
}
```

#### メリット
- URL履歴が正しく更新される
- ブラウザの戻るボタンが期待通りに動作する
- ブックマークが可能

#### 注意点
- クエリパラメータを正しく付与し、doGet側で適切にハンドリングする必要がある
- リダイレクトによる余分なリクエストが発生する

## 実装時の注意点

1. **エラーハンドリング**
   - サーバーサイド、クライアントサイドの両方で適切なエラーハンドリングを実装する
   - 詳細なログ出力を行い、デバッグを容易にする

2. **重複クリック防止**
   - 画面遷移時にはボタンやリンクを無効化し、重複クリックを防止する

3. **サンドボックスモードの設定**
   - HTMLOutputオブジェクトに適切なサンドボックスモードとXFrameOptionsを設定する

4. **クエリパラメータの扱い**
   - クエリパラメータは`e.parameter`から取得し、適切にハンドリングする

## まとめ

GAS Webアプリでの画面遷移は、通常のWebアプリケーションとは異なる実装方法が必要です。状況に応じて適切な方法を選択し、エラーハンドリングや重複クリック防止などの対策を実装することで、スムーズな画面遷移を実現できます。
