'use strict';

const express = require('express');
const router = express.Router();

const ensureAuthenticated = require('./ensure');

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

const marked = require('marked');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 1024 ** 2},
  fileFilter: (req, file, cb) => {
    return /image/.test(file.mimetype) ? cb(null, true) : cb(new Error('Unsupported file type'));
  }
}).single('thumbnail');

// 投稿ページを表示する
router.get('/new', ensureAuthenticated, csrfProtection, (req, res, next) => {
  res.render('new', {user: req.user, csrfToken: req.csrfToken()});
});

// 投稿を保存する
router.post('/',
  ensureAuthenticated,
  csrfProtection,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.render('new', {user: req.user, data: req.body, error: err, csrfToken: req.csrfToken()});
      } else if (err) {
        return res.render('new', {user: req.user, data: req.body, error: err, csrfToken: req.csrfToken()});
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
  csrfProtection,
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
        comments.forEach((comment) => {
          comment.formattedCreatedAt = dayjs(comment.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
          comment.formattedUpdatedAt = dayjs(comment.updatedAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
        });
        return res.render('application', {
          csrfToken: req.csrfToken(),
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
  csrfProtection,
  (req, res, next) => {
    Application.findOne({
      include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
      where: { applicationId: req.params.applicationId }
    }).then((application) => {
      if (application && parseInt(application.userId) === parseInt(req.user.userId)) {
        return res.render('edit', { application, user: req.user, csrfToken: req.csrfToken() });
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
  csrfProtection,
  (req, res, next) => {
    Application.findOne({
      where: {applicationId: req.params.applicationId}
    }).then((application) => {
      if (application && parseInt(application.userId) === parseInt(req.user.userId)) {
        if (parseInt(req.query.edit) === 1) {
          upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
              return res.render('edit', { user: req.user, application, data: req.body, error: err, csrfToken: req.csrfToken() });
            } else if (err) {
              return res.render('edit', { user: req.user, application, data: req.body, error: err, csrfToken: req.csrfToken() });
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
              return res.render('edit', { user: req.user, error, csrfToken: req.csrfToken() });
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