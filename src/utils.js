/**
 * ユーティリティ関数を提供するモジュール
 */

/**
 * 現在のユーザーのメールアドレスを取得する
 * @return {string} ユーザーのメールアドレス（取得できない場合は空文字列）
 */
function getUserEmail() {
  try {
    // 複数の方法でメールアドレスの取得を試みる
    let email = '';
    
    // 方法1: Session.getActiveUser()
    try {
      email = Session.getActiveUser().getEmail();
      if (email && email !== '') {
        console.log('【情報】getActiveUserでメールアドレスを取得しました: ' + email);
        return email;
      }
    } catch (err) {
      console.warn('【警告】getActiveUserでメールアドレス取得失敗: ' + err.message);
    }
    
    // 方法2: Session.getEffectiveUser()
    try {
      email = Session.getEffectiveUser().getEmail();
      if (email && email !== '') {
        console.log('【情報】getEffectiveUserでメールアドレスを取得しました: ' + email);
        return email;
      }
    } catch (err) {
      console.warn('【警告】getEffectiveUserでメールアドレス取得失敗: ' + err.message);
    }
    
    // 方法3: スクリプトのプロパティから取得を試みる
    try {
      const props = PropertiesService.getUserProperties();
      email = props.getProperty('USER_EMAIL');
      if (email && email !== '') {
        console.log('【情報】ユーザープロパティからメールアドレスを取得しました: ' + email);
        return email;
      }
    } catch (err) {
      console.warn('【警告】ユーザープロパティからメールアドレス取得失敗: ' + err.message);
    }
    
    console.log('【情報】メールアドレスを取得できませんでした');
    return '';
  } catch (e) {
    console.error('【エラー】メールアドレス取得中にエラーが発生しました: ' + e.message);
    return '';
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
