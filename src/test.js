/**
 * テスト用関数を提供するモジュール
 */

/**
 * リクエストに応じて適切なHTMLページを返すエンドポイント
 * ドキュメント駆動開発方針に基づき、GASのHTMLサービスで適切なページを返却
 * @param {Object} e - リクエストパラメータ
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  // リクエストパラメータの取得
  var params = e ? e.parameter : {};
  var page = params.page || '';
  var sessionId = params.sessionId || '';
  
  // HTMLサービスの設定を調整
  var htmlOutput;
  
  // セッションIDが指定されている場合は自動ログインを試行
  if (sessionId && page === '') {
    var authResult = authenticateBySession(sessionId);
    if (authResult && authResult.success) {
      // 自動ログイン成功時はフォーム一覧ページを表示
      page = 'list';
      console.log('【自動ログイン成功】ユーザーID: ' + authResult.userId);
    } else {
      // 自動ログイン失敗時はログインページを表示
      console.log('【自動ログイン失敗】セッションID: ' + sessionId);
    }
  }
  
  // ページに応じて適切なHTMLを返却
  if (page === 'signup') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('signup');
    htmlOutput.setTitle('フォーム管理システム - 新規登録');
  } else if (page === 'generate') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('formGenerate');
    htmlOutput.setTitle('フォーム管理システム - フォーム生成');
  } else if (page === 'list') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('formList');
    htmlOutput.setTitle('フォーム管理システム - フォーム一覧');
  } else {
    // デフォルトはログイン画面
    htmlOutput = HtmlService.createHtmlOutputFromFile('login');
    htmlOutput.setTitle('フォーム管理システム - ログイン');
  }
  
  // サンドボックスモードとタイトルを設定
  htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  
  return htmlOutput;
}

/**
 * サインアップページのHTMLを取得する関数
 * ログインページからの遷移用
 * @return {string} サインアップページのHTMLソース
 */
function getSignupPage() {
  // ログ出力
  console.log('サインアップページの取得を開始');
  
  try {
    // signup.htmlファイルの内容を取得
    var htmlOutput = HtmlService.createHtmlOutputFromFile('signup');
    var htmlContent = htmlOutput.getContent();
    
    console.log('サインアップページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('サインアップページの取得中にエラーが発生:', error);
    throw new Error('サインアップページの取得に失敗しました: ' + error.message);
  }
}

/**
 * ログイン認証API（login.htmlから呼び出し）
 * @param {GoogleAppsScript.Events.DoPost} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }
    var id = params.id;
    var password = params.password;
    var result = loginUser(id, password);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: 'APIエラー: ' + err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTMLサービスから呼び出されるログイン処理関数
 * google.script.runから直接呼び出されるためのエントリポイント
 * @param {string} id ユーザーID
 * @param {string} password パスワード
 * @return {Object} ログイン結果オブジェクト
 */
function processLogin(id, password) {
  try {
    console.log('【processLogin開始】ID=' + id);
    
    // ログイン処理を実行
    var result = loginUser(id, password);
    
    // 結果の詳細をログ出力
    console.log('【processLogin結果】' + JSON.stringify(result));
    
    // 成功の場合は結果を単純なオブジェクトとして返す
    if (result && result.success) {
      console.log('【processLogin成功】セッションID=' + result.sessionId);
      // 単純なオブジェクトを返す（Dateオブジェクトなどは文字列化）
      return {
        success: true,
        sessionId: String(result.sessionId),
        email: String(result.email),
        lastLogin: String(result.lastLogin)
      };
    } else {
      // 失敗の場合はエラーメッセージを返す
      console.log('【processLogin失敗】エラー=' + (result ? result.error : '不明'));
      return {
        success: false,
        error: result ? result.error : 'IDまたはパスワードが正しくありません'
      };
    }
  } catch (err) {
    console.error('【processLoginエラー】' + err.message);
    return {success: false, error: err.message};
  }
}

/**
 * テスト用関数：ユーザー登録とログインの一連のフローをテスト
 * システムの動作確認用にスプレッドシートの確認、ユーザー登録、ログインを順番に実行する。
 * @return {Object} 登録とログインの結果情報
 */
/**
 * ログインページを表示する関数
 * サインアップページからの遷移用
 * @return {string} ログインページのHTMLソース
 */
function getLoginPage() {
  console.log('ログインページの取得を開始');
  
  try {
    // login.htmlファイルの内容を取得
    var htmlOutput = HtmlService.createHtmlOutputFromFile('login');
    
    // サンドボックスモードとタイトルを設定
    htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
    htmlOutput.setTitle('フォーム管理システム - ログイン');
    
    // HTMLコンテンツを文字列として取得
    var htmlContent = htmlOutput.getContent();
    
    console.log('ログインページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('ログインページの取得中にエラーが発生:', error);
    throw new Error('ログインページの取得に失敗しました: ' + error.message);
  }
}

/**
 * ログイン画面へのリダイレクトを処理する関数
 * サインアップ画面からの遷移用
 * @return {string} リダイレクト先URL
 */
function redirectToLogin() {
  console.log('ログイン画面へのリダイレクトを処理します');
  
  try {
    // スクリプトのURLを取得
    var scriptUrl = ScriptApp.getService().getUrl();
    console.log('スクリプトURL:', scriptUrl);
    
    // クエリパラメータを除去してベースURLを取得
    var baseUrl = scriptUrl.split('?')[0];
    
    // ログイン画面を表示するためのクエリパラメータを追加
    var loginUrl = baseUrl + '?page=login';
    
    console.log('ログイン画面へのリダイレクトURL:', loginUrl);
    return loginUrl;
  } catch (error) {
    console.error('リダイレクトURLの取得中にエラーが発生:', error);
    // エラーの場合は空の文字列を返す
    return '';
  }
}

/**
 * フォーム生成ページのHTMLを取得する関数
 * ログイン後の画面遷移用
 * @return {string} フォーム生成ページのHTMLソース
 */
function getFormGeneratePage() {
  // ログ出力
  console.log('フォーム生成ページの取得を開始');
  
  try {
    // formGenerate.htmlファイルの内容を取得
    var htmlOutput = HtmlService.createHtmlOutputFromFile('formGenerate');
    var htmlContent = htmlOutput.getContent();
    
    console.log('フォーム生成ページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('フォーム生成ページの取得中にエラーが発生:', error);
    throw new Error('フォーム生成ページの取得に失敗しました: ' + error.message);
  }
}

/**
 * フォーム一覧ページのHTMLを取得する関数
 * ログイン後の画面遷移用
 * @return {string} フォーム一覧ページのHTMLソース
 */
function getFormListPage() {
  // ログ出力
  console.log('フォーム一覧ページの取得を開始');
  
  try {
    // formList.htmlファイルの内容を取得
    var htmlOutput = HtmlService.createHtmlOutputFromFile('formList');
    var htmlContent = htmlOutput.getContent();
    
    console.log('フォーム一覧ページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('フォーム一覧ページの取得中にエラーが発生:', error);
    throw new Error('フォーム一覧ページの取得に失敗しました: ' + error.message);
  }
}

/**
 * メインメニューページのHTMLを取得する関数
 * 各画面からの遷移用（現状はフォーム一覧画面を代用）
 * @return {string} メインメニューページのHTMLソース
 */
function getMainMenuPage() {
  // ログ出力
  console.log('メインメニューページの取得を開始');
  
  try {
    // 現状はフォーム一覧ページをメインメニューとして使用
    var htmlOutput = HtmlService.createHtmlOutputFromFile('formList');
    var htmlContent = htmlOutput.getContent();
    
    console.log('メインメニューページの取得成功');
    return htmlContent;
  } catch (error) {
    console.error('メインメニューページの取得中にエラーが発生:', error);
    throw new Error('メインメニューページの取得に失敗しました: ' + error.message);
  }
}

/**
 * テスト用関数：ユーザー登録とログインの一連のフローをテスト
 * システムの動作確認用にスプレッドシートの確認、ユーザー登録、ログインを順番に実行する。
 * @return {Object} 登録とログインの結果情報
 */
function testUserRegistrationAndLogin() {
  console.log('【テスト開始】ユーザー登録とログインの一連テストを開始します');
  
  try {
    // 1. スプレッドシートの確認
    console.log('【テストステップ1】スプレッドシートの確認を行います');
    const ssId = setupSpreadsheet();
    console.log('【テストステップ1完了】スプレッドシートID: ' + ssId);
    
    // 2. ユーザー登録
    console.log('【テストステップ2】テストユーザーの登録を行います');
    // メールアドレスにランダムな文字列を付加して重複を避ける
    const randomSuffix = Math.floor(Math.random() * 10000);
    const timestamp = new Date().getTime();
    const testEmail = `test${randomSuffix}_${timestamp}@example.com`;
    console.log('【テスト情報】テスト用メールアドレス: ' + testEmail);
    const userInfo = registerNewUser(testEmail);
    
    if (userInfo.error) {
      console.error('【テストエラー】ユーザー登録に失敗しました: ' + userInfo.error);
      return { error: userInfo.error, step: 'registration' };
    }
    
    console.log('【テストステップ2完了】ユーザー登録成功: ID=' + userInfo.id + ', パスワード=' + userInfo.password);
    
    // 3. ログインテスト
    console.log('【テストステップ3】生成されたID/パスワードでログインを行います');
    const loginResult = loginUser(userInfo.id, userInfo.password);
    
    if (!loginResult.success) {
      console.error('【テストエラー】ログインに失敗しました: ' + loginResult.error);
      return { 
        registration: userInfo, 
        login: { error: loginResult.error },
        step: 'login'
      };
    }
    
    console.log('【テストステップ3完了】ログイン成功: セッションID=' + loginResult.sessionId);
    console.log('【テスト完了】全テストが正常に完了しました');
    
    return {
      registration: userInfo,
      login: loginResult,
      success: true
    };
  } catch (e) {
    console.error('【テストエラー】テスト実行中に例外が発生しました: ' + e.message);
    return { error: e.message, stack: e.stack };
  }
}
