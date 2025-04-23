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
  
  // HTMLサービスの設定を調整
  var htmlOutput;
  
  // ページに応じて適切なHTMLを返却
  if (page === 'signup') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('signup');
  } else {
    // デフォルトはログイン画面
    htmlOutput = HtmlService.createHtmlOutputFromFile('login');
  }
  
  // サンドボックスモードとタイトルを設定
  htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  htmlOutput.setTitle('フォーム管理システム');
  
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
 * @return {GoogleAppsScript.HTML.HtmlOutput} ログインページのHtmlOutputオブジェクト
 */
function getLoginPage() {
  // ログ出力
  console.log('ログインページの取得を開始');  
  
  try {
    // login.htmlファイルからHtmlOutputオブジェクトを作成
    var htmlOutput = HtmlService.createHtmlOutputFromFile('login');
    
    // サンドボックスモードとタイトルを設定
    htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    htmlOutput.setSandboxMode(HtmlService.SandboxMode.IFRAME);
    htmlOutput.setTitle('フォーム管理システム - ログイン');
    
    console.log('ログインページの取得成功');
    return htmlOutput;
  } catch (error) {
    console.error('ログインページの取得中にエラーが発生:', error);
    throw new Error('ログインページの取得に失敗しました: ' + error.message);
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
