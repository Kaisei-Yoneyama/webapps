'use strict';

const uuid = require('uuid');
const FileType = require('file-type');

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

/** @type {S3Client} */
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY
  }
});

/**
 * ファイルを Amazon S3 に保存する
 * @param {Buffer | Uint8Array | ArrayBuffer} fileData 保存するファイルのデータ
 * @return {Promise<{type: string, name: string, url: string}>} 保存したファイルの情報を含む Promise
 */
async function putObject(fileData) {
  // Buffer からファイルタイプを取得する
  const fileTypeResult = await FileType.fromBuffer(fileData);
  const fileName = `${uuid.v4()}.${fileTypeResult.ext}`;
  const mimeType = fileTypeResult.mime;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    Body: fileData,
    ContentType: mimeType
  });

  // S3 に送信する
  const response = await s3Client.send(command);
  const httpStatusCode = response.$metadata.httpStatusCode;

  // ファイルの情報を返す
  return {
    type: mimeType,
    name: fileName,
    url: createObjectURL(BUCKET, REGION, fileName)
  };
}

/**
 * Amazon S3 からファイルを削除する
 * @param {string} fileName 削除するファイルの名前
 * @return {Promise} Promise
 */
async function deleteObject(fileName) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: fileName
  });

  const response = await s3Client.send(command);
  const httpStatusCode = response.$metadata.httpStatusCode;

  return response;
}

/**
 * Amazon S3 仮想ホスティング形式の URL を生成する
 * @param {string} bucket バケット名
 * @param {string} region リージョン
 * @param {string} key キー名
 * @returns {string} URL
 */
function createObjectURL(bucket, region, key) {
  // https://bucket-name.s3.Region.amazonaws.com/key name
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

module.exports = {
  s3Client,
  putObject,
  deleteObject,
  createObjectURL
};