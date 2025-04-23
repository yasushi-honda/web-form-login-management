/**
 * 認証サービス関連の機能を提供するモジュール
 * セッション管理や自動ログイン機能を担当
 */

/**
 * 永続トークン（rememberToken）を生成する
 * 自動ログイン機能で使用される長期間有効なトークンを生成
 * 
 * @param {string} userId - ユーザーID
 * @return {string} 生成された永続トークン
 */
function generateRememberToken(userId) {
  // UUID生成（衝突確率が極めて低い一意の文字列）
  const token = Utilities.getUuid();
  console.log('【処理中】永続トークンを生成しました: ' + token.substring(0, 8) + '...');
  
  return token;
}

/**
 * 永続トークンをユーザーに紐づけて保存
 * 
 * @param {string} userId - ユーザーID
 * @param {string} token - 永続トークン
 * @return {boolean} 保存成功の場合true
 */
function saveRememberToken(userId, token) {
  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です');
    return false;
  }
  
  try {
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return false;
    }
    
    // データ取得
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行の確認と必要に応じてrememberToken列の追加
    let rememberTokenColIndex = data[0].indexOf('rememberToken');
    if (rememberTokenColIndex === -1) {
      // rememberToken列が存在しない場合は追加
      rememberTokenColIndex = data[0].length;
      sheet.getRange(1, rememberTokenColIndex + 1).setValue('rememberToken');
      console.log('【処理中】rememberToken列を追加しました');
    }
    
    // ユーザーIDに一致する行を検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        // 該当ユーザーの行にrememberTokenを保存
        sheet.getRange(i + 1, rememberTokenColIndex + 1).setValue(token);
        console.log('【処理完了】ユーザーID: ' + userId + ' に永続トークンを保存しました');
        return true;
      }
    }
    
    console.warn('【警告】ユーザーID: ' + userId + ' が見つかりません');
    return false;
  } catch (e) {
    console.error('【エラー】永続トークン保存中に例外が発生しました: ' + e.message);
    return false;
  }
}

/**
 * 永続トークンによるユーザー認証
 * 自動ログイン機能で使用される
 * 
 * @param {string} token - 永続トークン
 * @return {Object} 認証結果とユーザー情報
 */
function authenticateByRememberToken(token) {
  // 入力値のバリデーション
  if (!token) {
    console.error('【エラー】永続トークンが指定されていません');
    return { success: false, error: '永続トークンが必要です' };
  }

  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です');
    return { success: false, error: 'システムエラー: データベースが初期化されていません' };
  }
  
  try {
    console.log('【処理開始】永続トークン認証処理を開始します: ' + token.substring(0, 8) + '...');
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { success: false, error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    // データ取得
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行の確認
    const rememberTokenColIndex = data[0].indexOf('rememberToken');
    if (rememberTokenColIndex === -1) {
      console.error('【エラー】rememberToken列が存在しません');
      return { success: false, error: 'システムエラー: 永続トークン列が存在しません' };
    }
    
    // 永続トークンに一致する行を検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][rememberTokenColIndex] === token) {
        // 該当ユーザーが見つかった場合
        const userId = data[i][0];
        
        // 新しいセッションIDを生成
        const sessionId = Utilities.getUuid();
        
        // 最終ログイン日時とセッションIDを更新
        const now = new Date();
        sheet.getRange(i + 1, 5).setValue(now); // 最終ログイン日時
        sheet.getRange(i + 1, 7).setValue(sessionId); // セッションID
        
        console.log('【処理完了】永続トークン認証成功: ID=' + userId);
        return { 
          success: true, 
          userId: userId,
          sessionId: sessionId,
          email: data[i][2],
          lastLogin: now
        };
      }
    }
    
    console.warn('【警告】永続トークン認証失敗: 無効なトークン');
    return { success: false, error: '自動ログイントークンが無効です。再ログインしてください。' };
  } catch (e) {
    console.error('【エラー】永続トークン認証中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました。管理者にお問い合わせください。' };
  }
}

/**
 * 永続トークンを無効化（削除）する
 * ログアウト時などに使用
 * 
 * @param {string} userId - ユーザーID
 * @return {boolean} 削除成功の場合true
 */
function invalidateRememberToken(userId) {
  // スプレッドシートの存在確認
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('【エラー】スプレッドシートが未作成です');
    return false;
  }
  
  try {
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName('ユーザー管理シート');
    
    if (!sheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return false;
    }
    
    // データ取得
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行の確認
    const rememberTokenColIndex = data[0].indexOf('rememberToken');
    if (rememberTokenColIndex === -1) {
      console.error('【エラー】rememberToken列が存在しません');
      return false;
    }
    
    // ユーザーIDに一致する行を検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        // 該当ユーザーの行のrememberTokenをクリア
        sheet.getRange(i + 1, rememberTokenColIndex + 1).setValue('');
        console.log('【処理完了】ユーザーID: ' + userId + ' の永続トークンを無効化しました');
        return true;
      }
    }
    
    console.warn('【警告】ユーザーID: ' + userId + ' が見つかりません');
    return false;
  } catch (e) {
    console.error('【エラー】永続トークン無効化中に例外が発生しました: ' + e.message);
    return false;
  }
}

/**
 * ベースURLを取得する
 * リダイレクト用
 * 
 * @return {string} WebアプリのベースURL
 */
function getBaseUrl() {
  return ScriptApp.getService().getUrl();
}
