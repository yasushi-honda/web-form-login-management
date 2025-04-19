/**
 * テスト用関数を提供するモジュール
 */

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
