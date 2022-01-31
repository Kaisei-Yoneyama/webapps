/*
  TODO
  - 例外処理
  - 脆弱性対策
  - Markdown 対応
  - いいね実装
*/


'use strict';

const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const ensureAuthenticated = require('./ensure');
const s3Client = require('../aws/s3Client');
const User = require('../models/user');
const Application = require('../models/application');
const Comment = require('../models/comment');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 1024 ** 2},
  fileFilter: (req, file, cb) => {
    return /image/.test(file.mimetype) ? cb(null, true) : cb(new Error('Unsupported file type'));
  }
}).single('thumbnail');

// 投稿ページを表示する
router.get('/new', ensureAuthenticated, (req, res, next) => {
  res.render('new', { user: req.user });
});

// 投稿を保存する
router.post('/',
  ensureAuthenticated,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.render('new', {user: req.user, data: req.body, error: err});
      } else if (err) {
        return res.render('new', {user: req.user, data: req.body, error: err});
      } 

      if (req.body.name && req.body.description && req.body.repository && req.body.url && req.file) {
        s3Client.putObject(req.file.buffer).then((file) => {
          Application.create({
            applicationId: uuid.v4(),
            applicationName: req.body.name.slice(0, 100),
            applicationDescription: req.body.description.slice(0, 1000),
            applicationRepository: req.body.repository.slice(0, 100),
            applicationUrl: req.body.url.slice(0, 100),
            applicationThumbnail: file.url,
            userId: req.user.userId
          }).then((application) => {
            return res.redirect(`/applications/${application.applicationId}`);
          }).catch(next);
        }).catch(next);
      } else {
        const error = new Error('入力必須項目に入力されていません');
        return res.render('new', { user: req.user, error });
      }
    });
  });

// 表示
router.get(
  '/:applicationId',
  (req, res, next) => {
    Application.findOne({
      include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      if (application === null) {
        const error = new Error('指定されたページは存在しません');
        error.status = 404;
        return next(error);
      }
      Comment.findAll({
        include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
        where: { applicationId: application.applicationId },
        order: [['commentId', 'DESC']]
      }).then((comments) => {
        return res.render('application', {
          application: application,
          comments: comments,
          user: req.user
        });
      }).catch(next);
    }).catch(next);
  });

// 編集
router.get(
  '/:applicationId/edit',
  ensureAuthenticated,
  (req, res, next) => {
    Application.findOne({
      include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      if (application && parseInt(application.userId) === parseInt(req.user.userId)) {
        return res.render('edit', { application, user: req.user });
      } else {
        const error = new Error('指定されたアプリがない、または編集する権限がありません');
        error.status = 404;
        return next(error);
      }
    }).catch(next);
  });

// 更新・削除
router.post(
  '/:applicationId',
  ensureAuthenticated,
  (req, res, next) => {
    Application.findOne({
      where: {applicationId: req.params.applicationId}
    }).then((application) => {
      if (application && parseInt(application.userId) === parseInt(req.user.userId)) {
        if (parseInt(req.query.edit) === 1) {
          upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
              return res.render('edit', { user: req.user, application, data: req.body, error: err });
            } else if (err) {
              return res.render('edit', { user: req.user, application, data: req.body, error: err });
            } 

            if (req.body.name && req.body.description && req.body.repository && req.body.url && req.file) {
              const thumbnail = application.applicationThumbnail.split('/').pop();
              s3Client.deleteObject(thumbnail).then(() => {
                s3Client.putObject(req.file.buffer).then((file) => {
                  application.update({
                    applicationId: application.applicationId,
                    applicationName: req.body.name.slice(0, 100),
                    applicationDescription: req.body.description.slice(0, 1000),
                    applicationRepository: req.body.repository.slice(0, 100),
                    applicationUrl: req.body.url.slice(0, 100),
                    applicationThumbnail: file.url,
                    userId: req.user.userId
                  }).then((application) => {
                    return res.redirect(`/applications/${application.applicationId}`);
                  }).catch(next);
                }).catch(next);
              }).catch(next);
            } else {
              const error = new Error('入力必須項目に入力されていません');
              return res.render('edit', { user: req.user, error });
            }
          });
        } else if (parseInt(req.query.delete) === 1) {
          const thumbnail = application.applicationThumbnail.split('/').pop();
          s3Client.deleteObject(thumbnail).then(() => {
            Comment.destroy({where: { applicationId: application.applicationId}}).then(() => {
              application.destroy().then(() => {
                return res.redirect('/');
              }).catch(next);
            }).catch(next);
          }).catch(next);
        }
      } else {
        const error = new Error('指定されたアプリがない、または編集する権限がありません');
        error.status = 404;
        return next(error);
      }
    }).catch(next);
  });

// 汎用エラーハンドラ
// router.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     console.error('MulterError', err.code);
//   } else {
//     next(err);
//   }
// });

module.exports = router;