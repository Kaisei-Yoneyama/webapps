'use strict';

const express = require('express');
const router = express.Router();

const createError = require('http-errors');
const ensureAuthenticated = require('./ensure');
const { body, param, query, validationResult } = require('express-validator');

const User = require('../models/user');
const Application = require('../models/application');
const Comment = require('../models/comment');

const uuid = require('uuid');
const s3Client = require('../aws/s3Client');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const multer = require('multer');

const upload = multer({
  // ファイルを一時的にメモリに保存する
  storage: multer.memoryStorage(),
  // 1MB 以下のファイルを受け入れる
  limits: { fileSize: 1024 ** 2 },
  // 画像のファイルのみ受け入れる
  fileFilter: (req, file, cb) => {
    if (/image/.test(file.mimetype)) {
      cb(null, true); // 受け入れる
    } else {
      const error = new Error('Unsupported file type');
      cb(error); // 受け入れない
    }
  }
}).single('thumbnail');

function uploader(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof Error) {
      // express-validator で使用するために req.locals に格納する
      res.locals.error = err;
      return next();
    } else {
      // express-validator で使用するために req.body に格納する
      req.body.file = req.file;
      return next();
    }
  });
}

function validator(value, { req, location, path }) {
  if (req.res.locals.error instanceof multer.MulterError) {
    throw req.res.locals.error;
  } else {
    return true;
  }
}

const validators = [
  body('file') // アプリのサムネイル
    .exists().withMessage('必須項目です')
    .custom(validator).withMessage('許可されたファイルではありません'),
  body('name') // アプリの名前
    .notEmpty().withMessage('必須項目です')
    .isLength({ max: 100 }).withMessage('100 字以内で入力してください'),
  body('description') // アプリの説明
    .notEmpty().withMessage('必須項目です')
    .isLength({ max: 1000 }).withMessage('1000 字以内で入力してください'),
  body('repository') // アプリのリポジトリ
    .notEmpty().withMessage('必須項目です')
    .isURL().withMessage('正しい URL を入力してください')
    .isLength({ max: 100 }).withMessage('100 字以内で入力してください'),
  body('url') // アプリの URL
    .notEmpty().withMessage('必須項目です')
    .isURL().withMessage('正しい URL を入力してください')
    .isLength({ max: 100 }).withMessage('100 字以内で入力してください'),
];

// 投稿ページを表示する
router.get('/new', ensureAuthenticated, csrfProtection, (req, res, next) => {
  res.render('new', { user: req.user, csrfToken: req.csrfToken() });
});

// 投稿内容を保存する
router.post('/',
  ensureAuthenticated,
  csrfProtection,
  uploader,
  validators,
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 作成ページを再表示する
      return res.render('new', {
        user: req.user,
        formData: req.body,
        errors: errors.errors,
        csrfToken: req.csrfToken()
      });
    }

    // S3 とデータベースに保存する
    s3Client.putObject(req.file.buffer)
      .then((file) => {
        Application.create({
          applicationId: uuid.v4(),
          applicationName: req.body.name,
          applicationDescription: req.body.description,
          applicationRepository: req.body.repository,
          applicationUrl: req.body.url,
          applicationThumbnail: file.url,
          userId: req.user.userId
        }).then((application) => {
          // 保存できたら紹介ページにリダイレクトする
          return res.redirect(`/applications/${application.applicationId}`);
        }).catch(next);
      }).catch(next);
  });

// 紹介ページを表示する
router.get(
  '/:applicationId',
  csrfProtection,
  param('applicationId').notEmpty().isUUID(),
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(404));
    }

    // アプリを取得する
    Application.findOne({
      include: [{ model: User, attributes: ['userId', 'userName', 'displayName', 'isAdmin' ] }],
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      // アプリが存在しない
      if (application === null) {
        return next(createError(404));
      }

      // コメントを取得する
      Comment.findAll({
        include: [{ model: User, attributes: [ 'userId', 'userName', 'isAdmin' ] }],
        where: { applicationId: application.applicationId },
        order: [['commentId', 'DESC']]
      }).then((comments) => {
        // 投稿・更新日時のフォーマット
        comments.forEach((comment) => {
          comment.formattedCreatedAt = dayjs(comment.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
          comment.formattedUpdatedAt = dayjs(comment.updatedAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
        });

        // 作品紹介ページを表示する
        return res.render('application', {
          csrfToken: req.csrfToken(),
          application: application,
          comments: comments,
          user: req.user
        });
      }).catch(next);
    }).catch(next);
  });

// 編集ページを表示する
router.get(
  '/:applicationId/edit',
  ensureAuthenticated,
  csrfProtection,
  param('applicationId')
    .notEmpty().isUUID(),
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(createError(404));
    }

    // 編集対象のアプリを取得する
    Application.findOne({
      include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      // アプリが存在して、作成者がリクエストしてきたユーザーなら編集ページを表示する
      // 管理者も削除できる
      if (application && parseInt(application.userId) === parseInt(req.user.userId) || req.user.isAdmin) {
        return res.render('edit', { application, user: req.user, csrfToken: req.csrfToken() });
      } else {
        return next(createError(404));
      }
    }).catch(next);
  });

// 編集内容を保存する
router.post(
  '/:applicationId/edit',
  ensureAuthenticated,
  csrfProtection,
  uploader,
  validators,
  param('applicationId')
    .notEmpty().isUUID(),
  (req, res, next) => {
    // 編集対象のアプリを取得する
    Application.findOne({
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      // アプリが存在して、作成者がリクエストしてきたユーザーなら編集内容を保存する
      if (application && parseInt(application.userId) === parseInt(req.user.userId)) {
        // バリデーションエラー
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          // 編集ページを再表示する
          return res.render('edit', {
            user: req.user,
            formData: req.body,
            errors: errors.errors,
            csrfToken: req.csrfToken(),
            application: application
          });
        }

        // S3 オブジェクトのキーを取得する
        const thumbnail = application.applicationThumbnail;
        const key = thumbnail.split('/').pop();

        // 既存のサムネイルを削除してから更新する
        s3Client.deleteObject(key)
          .then(() => {
            s3Client.putObject(req.file.buffer)
              .then((file) => {
                application.update({
                  applicationId: application.applicationId,
                  applicationName: req.body.name,
                  applicationDescription: req.body.description,
                  applicationRepository: req.body.repository,
                  applicationUrl: req.body.url,
                  applicationThumbnail: file.url,
                  userId: req.user.userId
                }).then((application) => {
                  // 更新できたら紹介ページにリダイレクトする
                  return res.redirect(`/applications/${application.applicationId}`);
                }).catch(next);
              }).catch(next);
          }).catch(next);
      } else {
        return next(createError(404));
      }
    }).catch(next);
  });

// 紹介を削除する
router.post(
  '/:applicationId/delete',
  ensureAuthenticated,
  csrfProtection,
  param('applicationId')
    .notEmpty().isUUID(),
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(createError(404));
    }

    // 削除対象のアプリを取得する
    Application.findOne({
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      // アプリが存在して、作成者がリクエストしてきたユーザーなら削除する
      // 管理者も削除できる
      if (application && parseInt(application.userId) === parseInt(req.user.userId) || req.user.isAdmin) {

        // S3 オブジェクトのキーを取得する
        const thumbnail = application.applicationThumbnail;
        const key = thumbnail.split('/').pop();

        // S3 とデータベースから削除する
        s3Client.deleteObject(key).then(() => {
          Comment.destroy({ where: { applicationId: application.applicationId } }).then(() => {
            application.destroy().then(() => {
              // 削除でたらマイページにリダイレクトする
              return res.redirect(`/users/${req.user.userName}`);
            }).catch(next);
          }).catch(next);
        }).catch(next);
      } else {
        return next(createError(404));
      }
    }).catch(next);
  });

module.exports = router;