'use strict';

const preview = document.getElementById('preview');
const uploader = document.getElementById('thumbnail');

uploader.addEventListener('change', handleFiles);

/**
 * ユーザーが選択したファイルを検証して
 * 対応している場合はプレビューを表示する
 */
function handleFiles() {
  // ファイルを選択しているか
  if (this.files.length === 0) {
    preview.src = '/images/thumbnail.png';
    return;
  }

  // 選択したファイルは単一か
  if (this.files.length > 1) {
    alert('単一のファイルをアップロードしてください');
    this.value = null;
    return;
  }

  // ファイルのサイズは 1MB 以下か
  if (this.files.item(0).size > (1 * 1024 * 1024)) {
    alert('1MB 以下のファイルをアップロードしてください');
    this.value = null;
    return;
  }

  // ファイルのタイプは image/* か
  if (!/image/.test(this.files.item(0).type)) {
    alert('画像のファイルをアップロードしてください');
    this.value = null;
    return;
  }

  // 選択したファイルのプレビュー
  readAsDataURL(this.files.item(0)).then((url) => {
    preview.src = url;
  });
}

/**
 * ファイルの内容をデータ URL として取得する
 * @param {File | Blob} file File または Blob オブジェクト
 * @return {Promise<string>} ファイルの内容を表す base64 文字列で解決する Promise
 */
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.addEventListener('load', (event) => {
      resolve(event.target.result);
    });

    reader.addEventListener('error', (event) => {
      reject(event.target.error);
    });
  });
}