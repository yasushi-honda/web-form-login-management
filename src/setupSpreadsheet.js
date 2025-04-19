"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSpreadsheet = void 0;
/**
 * スプレッドシートが存在しない場合に自動生成し、
 * 初期シートを構築する関数
 */
/// <reference types="google-apps-script" />
function setupSpreadsheet() {
    const props = PropertiesService.getScriptProperties();
    let ss;
    const id = props.getProperty('SPREADSHEET_ID');
    if (id) {
        try {
            ss = SpreadsheetApp.openById(id);
        }
        catch {
            ss = SpreadsheetApp.create('フォーム管理システムDB');
            props.setProperty('SPREADSHEET_ID', ss.getId());
        }
    }
    else {
        ss = SpreadsheetApp.create('フォーム管理システムDB');
        props.setProperty('SPREADSHEET_ID', ss.getId());
    }
    const sheetNames = ['ユーザー管理シート', 'フォーム管理シート', '設定シート'];
    sheetNames.forEach(name => {
        let sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.insertSheet(name);
        }
        if (sheet.getLastRow() === 0) {
            if (name === 'ユーザー管理シート') {
                sheet.appendRow(['アクセスID', 'パスワード', 'Googleアカウント', '登録日時', '最終ログイン日時', '自動ログインフラグ', 'セッションID']);
            }
            else if (name === 'フォーム管理シート') {
                sheet.appendRow(['アクセスID', 'Googleアカウント', 'フォーム種類', 'フォームID', 'フォームURL', '作成日時']);
            }
            else if (name === '設定シート') {
                sheet.appendRow(['設定項目', '値']);
            }
        }
    });
    ss.getSheets().forEach(s => {
        if (!sheetNames.includes(s.getName())) {
            ss.deleteSheet(s);
        }
    });
}
exports.setupSpreadsheet = setupSpreadsheet;
