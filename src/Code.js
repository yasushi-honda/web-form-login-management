/**
 * フォーム管理システム
 * 
 * Google Apps Script を使用したWebフォームログイン管理システム
 * 作成日: 2025-04-19
 */

/**
 * スプレッドシートが存在しない場合に自動生成し、
 * 初期シートを構築する関数
 */
function setupSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let ss;
  const id = props.getProperty('SPREADSHEET_ID');
  
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
      console.log('既存のスプレッドシートを開きました: ' + id);
    } catch (e) {
      ss = SpreadsheetApp.create('フォーム管理システムDB');
      props.setProperty('SPREADSHEET_ID', ss.getId());
      console.log('新規スプレッドシートを作成しました: ' + ss.getId());
    }
  } else {
    ss = SpreadsheetApp.create('フォーム管理システムDB');
    props.setProperty('SPREADSHEET_ID', ss.getId());
    console.log('新規スプレッドシートを作成しました: ' + ss.getId());
  }
  
  const sheetNames = ['ユーザー管理シート', 'フォーム管理シート', '設定シート'];
  
  sheetNames.forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      console.log('シートを作成しました: ' + name);
    }
    
    if (sheet.getLastRow() === 0) {
      if (name === 'ユーザー管理シート') {
        sheet.appendRow(['アクセスID', 'パスワード', 'Googleアカウント', '登録日時', '最終ログイン日時', '自動ログインフラグ', 'セッションID']);
      } else if (name === 'フォーム管理シート') {
        sheet.appendRow(['アクセスID', 'Googleアカウント', 'フォーム種類', 'フォームID', 'フォームURL', '作成日時']);
      } else if (name === '設定シート') {
        sheet.appendRow(['設定項目', '値']);
      }
      console.log('ヘッダー行を追加しました: ' + name);
    }
  });
  
  // 既存シートの削除処理
  try {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      if (!sheetNames.includes(sheet.getName())) {
        ss.deleteSheet(sheet);
        console.log('不要なシートを削除しました: ' + sheet.getName());
      }
    }
  } catch (e) {
    console.log('シート削除処理でエラーが発生しました: ' + e.message);
  }
  
  return ss.getId();
}

/**
 * 新規ユーザー登録
 * メールアドレスを受け取り、新規ユーザーを登録する。
 * メールアドレスの重複チェックを行い、アクセスIDとパスワードを生成する。
 * 
 * @param {string} email - ユーザーのメールアドレス
 * @return {Object} 生成されたID/パスワードまたはエラー情報
 */
function registerNewUser(email) {
  // 入力値のバリデーション
  if (!email) {
    console.error('【エラー】メールアドレスが指定されていません');
    return { error: 'メールアドレスを入力してください' };
  }
  
  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('【エラー】メールアドレスの形式が不正です: ' + email);
    return { error: '有効なメールアドレスを入力してください' };
  }

  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
    return { error: 'システムエラー: データベースが初期化されていません' };
  }
  
  try {
    console.log('【処理開始】ユーザー登録処理を開始します: ' + email);
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    // メール重複チェック
    console.log('【処理中】メールアドレスの重複をチェックします');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email) {
        console.warn('【警告】既存ユーザーが見つかりました: ' + email);
        return { error: 'このメールアドレスは既に登録されています' };
      }
    }
    
    // アクセスID/PW 生成
    console.log('【処理中】アクセスIDとパスワードを生成します');
    const id = generateRandomId(5);
    const password = generateRandomPassword(5);
    
    // ユーザー管理シートへの登録
    const now = new Date();
    sheet.appendRow([
      id,
      password,
      email,
      now,
      now,
      false,
      ''
    ]);
    
    console.log('【処理完了】新規ユーザーを登録しました: ' + email + ' (ID: ' + id + ')');
    return { id: id, password: password };
  } catch (e) {
    console.error('【エラー】ユーザー登録中に例外が発生しました: ' + e.message);
    return { error: 'システムエラーが発生しました。管理者にお問い合わせください。' };
  }
}

/**
 * ランダムなIDを生成
 * @param {number} length - IDの長さ
 * @return {string} 生成されたID
 */
function generateRandomId(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ランダムなパスワードを生成
 * @param {number} length - パスワードの長さ
 * @return {string} 生成されたパスワード
 */
function generateRandomPassword(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ユーザー認証
 * IDとパスワードを受け取り、ユーザー認証を行う。
 * 認証成功時はセッションIDを生成し、最終ログイン日時を更新する。
 * 
 * @param {string} id - ユーザーID
 * @param {string} password - パスワード
 * @return {Object} 認証結果とセッション情報
 */
function loginUser(id, password) {
  // 入力値のバリデーション
  if (!id || !password) {
    console.error('【エラー】IDまたはパスワードが指定されていません');
    return { success: false, error: 'IDとパスワードを入力してください' };
  }

  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
    return { success: false, error: 'システムエラー: データベースが初期化されていません' };
  }
  
  try {
    console.log('【処理開始】ログイン認証処理を開始します: ID=' + id);
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { success: false, error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    // ID/PW照合
    console.log('【処理中】ユーザー認証情報を照合します');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.warn('【警告】ユーザーデータが存在しません');
      return { success: false, error: '登録されたユーザーがありません' };
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id && data[i][1] === password) {
        // セッションID生成
        console.log('【処理中】認証成功、セッションIDを生成します');
        const sessionId = Utilities.getUuid();
        
        // 最終ログイン日時とセッションIDを更新
        const now = new Date();
        sheet.getRange(i + 1, 5).setValue(now); // 最終ログイン日時
        sheet.getRange(i + 1, 7).setValue(sessionId); // セッションID
        
        console.log('【処理完了】ログイン成功: ID=' + id + ', メール=' + data[i][2]);
        return { 
          success: true, 
          sessionId: sessionId,
          email: data[i][2],
          lastLogin: now
        };
      }
    }
    
    console.warn('【警告】ログイン失敗: ID=' + id + ' (認証情報不一致)');
    return { success: false, error: 'IDまたはパスワードが正しくありません' };
  } catch (e) {
    console.error('【エラー】ログイン処理中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました。管理者にお問い合わせください。' };
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
    const testEmail = 'test@example.com';
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
