/**
 * スプレッドシートが存在しない場合に自動生成し、
 * 初期シートを構築する関数
 * 
 * @return {string} スプレッドシートのID
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
