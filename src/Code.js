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
 * @param {string} email - ユーザーのメールアドレス
 * @return {Object} 生成されたID/パスワード
 */
function registerNewUser(email) {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください。');
    throw new Error('スプレッドシートが未作成です');
  }
  
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName('ユーザー管理シート');
  
  // メール重複チェック
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      console.log('既存ユーザーが見つかりました: ' + email);
      return { error: 'このメールアドレスは既に登録されています' };
    }
  }
  
  // アクセスID/PW 生成
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
  
  console.log('新規ユーザーを登録しました: ' + email);
  return { id: id, password: password };
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
 * @param {string} id - ユーザーID
 * @param {string} password - パスワード
 * @return {Object} 認証結果
 */
function loginUser(id, password) {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    console.error('スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください。');
    throw new Error('スプレッドシートが未作成です');
  }
  
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName('ユーザー管理シート');
  
  // ID/PW照合
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id && data[i][1] === password) {
      // セッションID生成
      const sessionId = Utilities.getUuid();
      
      // 最終ログイン日時とセッションIDを更新
      const now = new Date();
      sheet.getRange(i + 1, 5).setValue(now); // 最終ログイン日時
      sheet.getRange(i + 1, 7).setValue(sessionId); // セッションID
      
      console.log('ログイン成功: ' + id);
      return { 
        success: true, 
        sessionId: sessionId,
        email: data[i][2]
      };
    }
  }
  
  console.log('ログイン失敗: ' + id);
  return { success: false, error: 'IDまたはパスワードが正しくありません' };
}
