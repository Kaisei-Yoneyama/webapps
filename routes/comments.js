'use strict';

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./ensure');
const Comment = require('../models/comment');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const { body, param, query, validationResult } = require('express-validator');

// 投稿
router.post(
  '/:applicationId/comments',
  ensureAuthenticated,
  csrfProtection,
  param('applicationId').notEmpty().isUUID(),
  body('comment').notEmpty().isLength({ max: 200 }),
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.redirect(`/applications/${req.params.applicationId}`);
    }

    // 保存する
    Comment.create({
      userId: req.user.userId,
      applicationId: req.params.applicationId,
      comment: req.body.comment
    }).then((comment) => {
      res.redirect(`/applications/${comment.applicationId}`);
    }).catch(next);
  }
);

// 削除
router.post(
  '/:applicationId/comments/:commentId/delete',
  ensureAuthenticated,
  csrfProtection,
  param('applicationId').notEmpty().isUUID(),
  param('commentId').notEmpty().isNumeric(),
  (req, res, next) => {
    // バリデーションエラー
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.redirect(`/applications/${req.params.applicationId}`);
    }

    // コメントが存在して、投稿者がリクエストしてきたユーザーなら削除する
    Comment.findByPk(req.params.commentId).then((comment) => {
      if (comment && comment.userId === req.user.userId) {
        comment.destroy().then(() => {
          res.redirect(`/applications/${req.params.applicationId}`);
        }).catch(next);
      }
    });
  }
);

module.exports = router;