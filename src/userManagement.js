/**
 * ユーザー管理関連の機能を提供するモジュール
 */

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
 * セッションIDによるユーザー認証
 * セッションIDを受け取り、有効なセッションかどうかを確認する。
 * 自動ログイン機能で使用される。
 * 
 * @param {string} sessionId - セッションID
 * @return {Object} 認証結果とユーザー情報
 */
function authenticateBySession(sessionId) {
  // 入力値のバリデーション
  if (!sessionId) {
    console.error('【エラー】セッションIDが指定されていません');
    return { success: false, error: 'セッションIDが必要です' };
  }

  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
    return { success: false, error: 'システムエラー: データベースが初期化されていません' };
  }
  
  try {
    console.log('【処理開始】セッション認証処理を開始します: ' + sessionId);
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { success: false, error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    // セッションIDを照合
    console.log('【処理中】セッションIDを照合します');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.warn('【警告】ユーザーデータが存在しません');
      return { success: false, error: '登録されたユーザーがありません' };
    }
    
    // セッションIDは7列目（インデックス6）
    for (let i = 1; i < data.length; i++) {
      if (data[i][6] === sessionId) {
        // セッション有効性確認（将来的には期限切れチェックを追加予定）
        
        // 最終ログイン日時を更新
        const now = new Date();
        sheet.getRange(i + 1, 5).setValue(now); // 最終ログイン日時
        
        console.log('【処理完了】セッション認証成功: ID=' + data[i][0] + ', メール=' + data[i][2]);
        return { 
          success: true, 
          userId: data[i][0],
          email: data[i][2],
          lastLogin: now
        };
      }
    }
    
    console.warn('【警告】セッション認証失敗: 無効なセッションID');
    return { success: false, error: 'セッションが無効です。再ログインしてください。' };
  } catch (e) {
    console.error('【エラー】セッション認証中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました。管理者にお問い合わせください。' };
  }
}
