/**
 * サインアップ機能のテスト用スクリプト
 */

/**
 * サインアップ機能の動作テスト
 * 1. signup.htmlファイルの存在確認
 * 2. registerNewUser関数の動作確認
 * 3. 画面遷移の確認
 * @return {Object} テスト結果
 */
function testSignupFeature() {
  console.log('【サインアップ機能テスト開始】');
  
  const results = {
    fileCheck: false,
    apiCheck: false,
    navigationCheck: false
  };
  
  try {
    // 1. signup.htmlファイルの存在確認
    console.log('【テストステップ1】signup.htmlファイルの存在確認');
    try {
      const htmlOutput = HtmlService.createHtmlOutputFromFile('signup');
      const htmlContent = htmlOutput.getContent();
      if (htmlContent && htmlContent.includes('新規ユーザー登録')) {
        console.log('【テストステップ1成功】signup.htmlファイルが正常に読み込めました');
        results.fileCheck = true;
      } else {
        console.warn('【テストステップ1警告】signup.htmlファイルの内容が想定と異なります');
        results.fileCheck = 'ファイルは存在しますが、内容に問題がある可能性があります';
      }
    } catch (err) {
      console.error('【テストステップ1失敗】signup.htmlファイルの読み込みに失敗しました:', err.message);
      results.fileCheck = false;
    }
    
    // 2. registerNewUser関数の動作確認
    console.log('【テストステップ2】registerNewUser関数の動作確認');
    try {
      // テスト用のランダムなメールアドレスを生成
      const randomSuffix = Math.floor(Math.random() * 10000);
      const timestamp = new Date().getTime();
      const testEmail = `test${randomSuffix}_${timestamp}@example.com`;
      console.log('【テスト情報】テスト用メールアドレス:', testEmail);
      
      // registerNewUser関数を呼び出し
      const result = registerNewUser(testEmail);
      console.log('【テスト情報】registerNewUser結果:', result);
      
      if (result && result.id && result.password) {
        console.log('【テストステップ2成功】registerNewUser関数が正常に動作しました');
        results.apiCheck = {
          success: true,
          id: result.id,
          password: result.password
        };
      } else {
        console.warn('【テストステップ2警告】registerNewUser関数の結果が想定と異なります:', result);
        results.apiCheck = {
          success: false,
          error: result.error || '不明なエラー'
        };
      }
    } catch (err) {
      console.error('【テストステップ2失敗】registerNewUser関数の実行に失敗しました:', err.message);
      results.apiCheck = {
        success: false,
        error: err.message
      };
    }
    
    // 3. 画面遷移の確認
    console.log('【テストステップ3】画面遷移の確認');
    try {
      // getSignupPage関数の動作確認
      const signupPageContent = getSignupPage();
      if (signupPageContent && signupPageContent.includes('新規ユーザー登録')) {
        console.log('【テストステップ3-1成功】getSignupPage関数が正常に動作しました');
        results.navigationCheck = true;
      } else {
        console.warn('【テストステップ3-1警告】getSignupPage関数の結果が想定と異なります');
        results.navigationCheck = 'getSignupPage関数の結果に問題がある可能性があります';
      }
    } catch (err) {
      console.error('【テストステップ3失敗】画面遷移の確認に失敗しました:', err.message);
      results.navigationCheck = false;
    }
    
    console.log('【サインアップ機能テスト完了】結果:', results);
    return results;
  } catch (e) {
    console.error('【テスト全体エラー】:', e.message);
    return {
      error: e.message,
      stack: e.stack,
      results: results
    };
  }
}

/**
 * サインアップ機能の修正が必要な点を確認するテスト
 * @return {Object} 修正が必要な点のリスト
 */
function checkSignupIssues() {
  console.log('【サインアップ機能の問題点確認開始】');
  
  const issues = [];
  
  try {
    // 1. signup.htmlファイルの内容確認
    try {
      const htmlOutput = HtmlService.createHtmlOutputFromFile('signup');
      const htmlContent = htmlOutput.getContent();
      
      // 必要な要素が含まれているか確認
      if (!htmlContent.includes('registerNewUser')) {
        issues.push('signup.htmlからregisterNewUser関数が呼び出されていない可能性があります');
      }
      
      if (!htmlContent.includes('loginLink')) {
        issues.push('ログイン画面へのリンクが実装されていない可能性があります');
      }
    } catch (err) {
      issues.push('signup.htmlファイルの読み込みに失敗しました: ' + err.message);
    }
    
    // 2. getSignupPage関数の確認
    try {
      const functionString = getSignupPage.toString();
      if (!functionString.includes('signup.html') && !functionString.includes('signup')) {
        issues.push('getSignupPage関数がsignup.htmlを正しく参照していない可能性があります');
      }
    } catch (err) {
      issues.push('getSignupPage関数の確認に失敗しました: ' + err.message);
    }
    
    // 3. login.htmlからの遷移確認
    try {
      const loginHtml = HtmlService.createHtmlOutputFromFile('login').getContent();
      if (!loginHtml.includes('getSignupPage')) {
        issues.push('login.htmlからgetSignupPage関数が呼び出されていない可能性があります');
      }
    } catch (err) {
      issues.push('login.htmlの確認に失敗しました: ' + err.message);
    }
    
    console.log('【サインアップ機能の問題点確認完了】問題点:', issues.length > 0 ? issues : '問題は見つかりませんでした');
    return {
      hasIssues: issues.length > 0,
      issues: issues
    };
  } catch (e) {
    console.error('【問題点確認全体エラー】:', e.message);
    return {
      error: e.message,
      issues: issues
    };
  }
}
