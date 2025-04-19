/// <reference types="google-apps-script" />

/**
 * 新規ユーザー登録
 */
function registerNewUser(email: string): {id: string; password: string} {
  const props = PropertiesService.getScriptProperties();
  // TODO: メール重複チェック
  // TODO: アクセスID/PW 生成
  // TODO: ユーザー管理シートへの登録
  // TODO: プロパティサービス保存
  return {id: '', password: ''};
}
