/**
 * フォーム管理関連の機能を提供するモジュール
 */

/**
 * テンプレートフォームからユーザー専用フォームを作成する
 * セッションIDを使用してユーザーを特定し、指定されたテンプレートタイプのフォームを作成する
 * 
 * @param {string} templateType - テンプレートの種類（設定シートに登録されたキー）
 * @param {string} sessionId - ユーザーのセッションID
 * @return {Object} 作成結果（成功時はフォーム情報、失敗時はエラー情報）
 */
function createUserForm(templateType, sessionId) {
  // 入力値のバリデーション
  if (!templateType || !sessionId) {
    console.error('【エラー】テンプレートタイプまたはセッションIDが指定されていません');
    return { success: false, error: 'テンプレートタイプとセッションIDは必須です' };
  }
  
  try {
    console.log('【処理開始】ユーザーフォーム作成処理を開始します: テンプレート=' + templateType);
    
    // スプレッドシートの存在確認
    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SPREADSHEET_ID');
    
    if (!ssId) {
      console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
      return { success: false, error: 'システムエラー: データベースが初期化されていません' };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    
    // 1. セッションIDからユーザー情報を取得
    console.log('【処理中】セッションIDからユーザー情報を取得します');
    const userSheet = ss.getSheetByName('ユーザー管理シート');
    if (!userSheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { success: false, error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    const userData = userSheet.getDataRange().getValues();
    let userId = null;
    let userEmail = null;
    
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][6] === sessionId) { // セッションIDは7列目（インデックス6）
        userId = userData[i][0];     // アクセスID
        userEmail = userData[i][2];  // Googleアカウント
        break;
      }
    }
    
    if (!userId || !userEmail) {
      console.error('【エラー】セッションIDに対応するユーザーが見つかりません: ' + sessionId);
      return { success: false, error: '認証エラー: 再ログインしてください' };
    }
    
    // 2. テンプレートIDを設定シートから取得
    console.log('【処理中】テンプレートIDを設定シートから取得します');
    const settingSheet = ss.getSheetByName('設定シート');
    if (!settingSheet) {
      console.error('【エラー】設定シートが見つかりません');
      return { success: false, error: 'システムエラー: 設定シートが存在しません' };
    }
    
    const settingData = settingSheet.getDataRange().getValues();
    let templateId = null;
    const templateKey = 'テンプレート: ' + templateType;
    
    for (let i = 1; i < settingData.length; i++) {
      if (settingData[i][0] === templateKey) {
        templateId = settingData[i][1];
        break;
      }
    }
    
    if (!templateId) {
      console.error('【エラー】指定されたテンプレートタイプが設定シートに存在しません: ' + templateType);
      return { success: false, error: '指定されたテンプレートが見つかりません' };
    }
    
    // 3. テンプレートフォームを複製
    console.log('【処理中】テンプレートフォームを複製します: ' + templateId);
    let templateForm;
    try {
      templateForm = FormApp.openById(templateId);
    } catch (e) {
      console.error('【エラー】テンプレートフォームが開けません: ' + e.message);
      return { success: false, error: 'テンプレートフォームが見つかりません' };
    }
    
    // ユーザー名とフォーム種類を含むタイトルを生成
    const newFormTitle = `${templateType} - ${userEmail}`;
    
    // DriveAppを使用してフォームを複製
    const templateFile = DriveApp.getFileById(templateId);
    const newFile = templateFile.makeCopy(newFormTitle);
    const formId = newFile.getId();
    
    // 複製したフォームを開く
    const newForm = FormApp.openById(formId);
    const formUrl = newForm.getPublishedUrl();
    
    console.log('【処理中】フォームを複製しました: ' + formId);
    
    // 4. ユーザーにフォームの編集権限を付与
    try {
      const formFile = DriveApp.getFileById(formId);
      formFile.addEditor(userEmail);
      console.log('【処理中】フォームに編集権限を付与しました: ' + userEmail);
    } catch (e) {
      console.warn('【警告】フォームへの編集権限付与に失敗しました: ' + e.message);
      // 権限付与に失敗してもフォーム自体は作成できているので処理を続行
    }
    
    // 5. フォーム情報をスプレッドシートに登録
    console.log('【処理中】フォーム情報をスプレッドシートに登録します');
    const formSheet = ss.getSheetByName('フォーム管理シート');
    if (!formSheet) {
      console.error('【エラー】フォーム管理シートが見つかりません');
      return { success: false, error: 'システムエラー: フォーム管理シートが存在しません' };
    }
    
    // 同じユーザー・同じタイプのフォームが既に存在するか確認
    const formData = formSheet.getDataRange().getValues();
    let existingFormRow = -1;
    
    for (let i = 1; i < formData.length; i++) {
      if (formData[i][0] === userId && formData[i][2] === templateType) {
        existingFormRow = i + 1; // 行番号は1から始まるため+1
        break;
      }
    }
    
    const now = new Date();
    if (existingFormRow > 0) {
      // 既存のフォーム情報を更新
      formSheet.getRange(existingFormRow, 4).setValue(formId);       // フォームID
      formSheet.getRange(existingFormRow, 5).setValue(formUrl);      // フォームURL
      formSheet.getRange(existingFormRow, 6).setValue(now);          // 作成日時
      console.log('【処理中】既存のフォーム情報を更新しました: 行=' + existingFormRow);
    } else {
      // 新規にフォーム情報を追加
      formSheet.appendRow([
        userId,       // アクセスID
        userEmail,    // Googleアカウント
        templateType, // フォーム種類
        formId,       // フォームID
        formUrl,      // フォームURL
        now           // 作成日時
      ]);
      console.log('【処理中】新規にフォーム情報を追加しました');
    }
    
    console.log('【処理完了】ユーザーフォーム作成が完了しました: ' + formId);
    return {
      success: true,
      formId: formId,
      formUrl: formUrl,
      formTitle: newFormTitle,
      templateType: templateType
    };
  } catch (e) {
    console.error('【エラー】フォーム作成中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました: ' + e.message };
  }
}

/**
 * ユーザーの所有するフォーム一覧を取得する
 * セッションIDを使用してユーザーを特定し、そのユーザーが所有するフォームの一覧を返す
 * 
 * @param {string} sessionId - ユーザーのセッションID
 * @return {Object} フォーム一覧またはエラー情報
 */
function getUserForms(sessionId) {
  // 入力値のバリデーション
  if (!sessionId) {
    console.error('【エラー】セッションIDが指定されていません');
    return { success: false, error: 'セッションIDは必須です' };
  }
  
  try {
    console.log('【処理開始】ユーザーフォーム一覧取得処理を開始します: セッションID=' + sessionId);
    
    // スプレッドシートの存在確認
    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SPREADSHEET_ID');
    
    if (!ssId) {
      console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
      return { success: false, error: 'システムエラー: データベースが初期化されていません' };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    
    // 1. セッションIDからユーザー情報を取得
    console.log('【処理中】セッションIDからユーザー情報を取得します');
    const userSheet = ss.getSheetByName('ユーザー管理シート');
    if (!userSheet) {
      console.error('【エラー】ユーザー管理シートが見つかりません');
      return { success: false, error: 'システムエラー: ユーザー管理シートが存在しません' };
    }
    
    const userData = userSheet.getDataRange().getValues();
    let userId = null;
    
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][6] === sessionId) { // セッションIDは7列目（インデックス6）
        userId = userData[i][0]; // アクセスID
        break;
      }
    }
    
    if (!userId) {
      console.error('【エラー】セッションIDに対応するユーザーが見つかりません: ' + sessionId);
      return { success: false, error: '認証エラー: 再ログインしてください' };
    }
    
    // 2. ユーザーIDに紐づくフォーム一覧を取得
    console.log('【処理中】ユーザーIDに紐づくフォーム一覧を取得します: ' + userId);
    const formSheet = ss.getSheetByName('フォーム管理シート');
    if (!formSheet) {
      console.error('【エラー】フォーム管理シートが見つかりません');
      return { success: false, error: 'システムエラー: フォーム管理シートが存在しません' };
    }
    
    const formData = formSheet.getDataRange().getValues();
    const forms = [];
    
    for (let i = 1; i < formData.length; i++) {
      if (formData[i][0] === userId) {
        forms.push({
          type: formData[i][2],         // フォーム種類
          id: formData[i][3],           // フォームID
          url: formData[i][4],          // フォームURL
          createdAt: formData[i][5]     // 作成日時
        });
      }
    }
    
    console.log('【処理完了】ユーザーフォーム一覧取得が完了しました: ' + forms.length + '件');
    return {
      success: true,
      forms: forms
    };
  } catch (e) {
    console.error('【エラー】フォーム一覧取得中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました: ' + e.message };
  }
}

/**
 * 利用可能なテンプレートタイプの一覧を取得する
 * 設定シートから「テンプレート: 」で始まる設定項目を抽出する
 * 
 * @return {Object} テンプレートタイプ一覧またはエラー情報
 */
function getTemplateTypes() {
  try {
    console.log('【処理開始】テンプレートタイプ一覧取得処理を開始します');
    
    // スプレッドシートの存在確認
    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SPREADSHEET_ID');
    
    if (!ssId) {
      console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
      return { success: false, error: 'システムエラー: データベースが初期化されていません' };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const settingSheet = ss.getSheetByName('設定シート');
    
    if (!settingSheet) {
      console.error('【エラー】設定シートが見つかりません');
      return { success: false, error: 'システムエラー: 設定シートが存在しません' };
    }
    
    const settingData = settingSheet.getDataRange().getValues();
    const templateTypes = [];
    const templatePrefix = 'テンプレート: ';
    
    for (let i = 1; i < settingData.length; i++) {
      const settingKey = settingData[i][0];
      if (settingKey && settingKey.startsWith(templatePrefix)) {
        const templateType = settingKey.substring(templatePrefix.length);
        templateTypes.push(templateType);
      }
    }
    
    console.log('【処理完了】テンプレートタイプ一覧取得が完了しました: ' + templateTypes.length + '件');
    return {
      success: true,
      templates: templateTypes
    };
  } catch (e) {
    console.error('【エラー】テンプレートタイプ一覧取得中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました: ' + e.message };
  }
}

/**
 * テスト用関数：テンプレートフォーム設定を追加する
 * 設定シートにテンプレートフォームのIDを登録する
 * 
 * @param {string} templateType - テンプレートの種類
 * @param {string} templateId - テンプレートフォームのID
 * @return {Object} 設定結果
 */
function addTemplateFormSetting(templateType, templateId) {
  try {
    console.log('【処理開始】テンプレートフォーム設定追加処理を開始します: ' + templateType);
    
    // スプレッドシートの存在確認
    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SPREADSHEET_ID');
    
    if (!ssId) {
      console.error('【エラー】スプレッドシートが未作成です。setupSpreadsheet()を先に実行してください');
      return { success: false, error: 'システムエラー: データベースが初期化されていません' };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(ssId);
    const settingSheet = ss.getSheetByName('設定シート');
    
    if (!settingSheet) {
      console.error('【エラー】設定シートが見つかりません');
      return { success: false, error: 'システムエラー: 設定シートが存在しません' };
    }
    
    // テンプレート設定が既に存在するか確認
    const settingData = settingSheet.getDataRange().getValues();
    const templateKey = 'テンプレート: ' + templateType;
    let existingRow = -1;
    
    for (let i = 1; i < settingData.length; i++) {
      if (settingData[i][0] === templateKey) {
        existingRow = i + 1; // 行番号は1から始まるため+1
        break;
      }
    }
    
    if (existingRow > 0) {
      // 既存の設定を更新
      settingSheet.getRange(existingRow, 2).setValue(templateId);
      console.log('【処理中】既存のテンプレート設定を更新しました: ' + templateKey);
    } else {
      // 新規に設定を追加
      settingSheet.appendRow([templateKey, templateId]);
      console.log('【処理中】新規にテンプレート設定を追加しました: ' + templateKey);
    }
    
    console.log('【処理完了】テンプレートフォーム設定追加が完了しました');
    return {
      success: true,
      templateType: templateType,
      templateId: templateId
    };
  } catch (e) {
    console.error('【エラー】テンプレートフォーム設定追加中に例外が発生しました: ' + e.message);
    return { success: false, error: 'システムエラーが発生しました: ' + e.message };
  }
}

/**
 * テスト用関数：テンプレートフォーム自動生成機能のテスト
 * テスト用のテンプレート設定を追加し、フォーム生成を試行する
 * 
 * @return {Object} テスト結果
 */
function testFormGeneration() {
  try {
    console.log('【テスト開始】テンプレートフォーム自動生成機能のテストを開始します');
    
    // 1. スプレッドシートの確認
    console.log('【テストステップ1】スプレッドシートの確認を行います');
    const ssId = setupSpreadsheet();
    console.log('【テストステップ1完了】スプレッドシートID: ' + ssId);
    
    // 2. テスト用ユーザーの登録
    console.log('【テストステップ2】テストユーザーの登録を行います');
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
    
    const sessionId = loginResult.sessionId;
    console.log('【テストステップ3完了】ログイン成功: セッションID=' + sessionId);
    
    // 4. テスト用テンプレートフォームの作成
    console.log('【テストステップ4】テスト用テンプレートフォームを作成します');
    const testFormTitle = 'テスト用テンプレートフォーム_' + timestamp;
    const testForm = FormApp.create(testFormTitle);
    testForm.addMultipleChoiceItem()
      .setTitle('テスト質問')
      .setChoiceValues(['選択肢1', '選択肢2', '選択肢3']);
    
    const testFormId = testForm.getId();
    console.log('【テストステップ4完了】テンプレートフォーム作成成功: ID=' + testFormId);
    
    // 5. テンプレート設定の追加
    console.log('【テストステップ5】テンプレート設定を追加します');
    const testTemplateType = 'テストフォーム_' + timestamp;
    const templateSetting = addTemplateFormSetting(testTemplateType, testFormId);
    
    if (!templateSetting.success) {
      console.error('【テストエラー】テンプレート設定追加に失敗しました: ' + templateSetting.error);
      return {
        registration: userInfo,
        login: loginResult,
        templateForm: { id: testFormId, title: testFormTitle },
        templateSetting: { error: templateSetting.error },
        step: 'template_setting'
      };
    }
    
    console.log('【テストステップ5完了】テンプレート設定追加成功');
    
    // 6. フォーム生成テスト
    console.log('【テストステップ6】ユーザーフォームを生成します');
    const formGeneration = createUserForm(testTemplateType, sessionId);
    
    if (!formGeneration.success) {
      console.error('【テストエラー】フォーム生成に失敗しました: ' + formGeneration.error);
      return {
        registration: userInfo,
        login: loginResult,
        templateForm: { id: testFormId, title: testFormTitle },
        templateSetting: templateSetting,
        formGeneration: { error: formGeneration.error },
        step: 'form_generation'
      };
    }
    
    console.log('【テストステップ6完了】フォーム生成成功: ID=' + formGeneration.formId);
    
    // 7. フォーム一覧取得テスト
    console.log('【テストステップ7】ユーザーフォーム一覧を取得します');
    const formList = getUserForms(sessionId);
    
    if (!formList.success) {
      console.error('【テストエラー】フォーム一覧取得に失敗しました: ' + formList.error);
      return {
        registration: userInfo,
        login: loginResult,
        templateForm: { id: testFormId, title: testFormTitle },
        templateSetting: templateSetting,
        formGeneration: formGeneration,
        formList: { error: formList.error },
        step: 'form_list'
      };
    }
    
    console.log('【テストステップ7完了】フォーム一覧取得成功: ' + formList.forms.length + '件');
    console.log('【テスト完了】全テストが正常に完了しました');
    
    return {
      success: true,
      registration: userInfo,
      login: loginResult,
      templateForm: { id: testFormId, title: testFormTitle },
      templateSetting: templateSetting,
      formGeneration: formGeneration,
      formList: formList
    };
  } catch (e) {
    console.error('【テストエラー】テスト実行中に例外が発生しました: ' + e.message);
    return { error: e.message, stack: e.stack };
  }
}
