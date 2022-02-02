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
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      Comment.create({
        userId: req.user.userId,
        applicationId: req.params.applicationId,
        comment: req.body.comment
      }).then((comment) => {
        console.info('コメントが投稿されました', comment);
        res.redirect(`/applications/${comment.applicationId}`);
      }).catch(next);
    } else {
      console.error('コメントの投稿に失敗しました', errors);
      res.redirect(`/applications/${req.params.applicationId}`);
    }
  }
);

// 削除
router.post(
  '/:applicationId/comments/:commentId',
  ensureAuthenticated,
  csrfProtection,
  param('applicationId').notEmpty().isUUID(),
  param('commentId').notEmpty().isNumeric(),
  query('delete').notEmpty().isWhitelisted('1'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      Comment.findByPk(req.params.commentId).then((comment) => {
        if (comment && comment.userId === req.user.userId) {
          comment.destroy().then(() => {
            console.info('コメントが削除されました', comment);
            res.redirect(`/applications/${req.params.applicationId}`);
          }).catch(next);
        }
      });
    } else {
      console.error('コメントの削除に失敗しました', errors)
      res.redirect(`/applications/${req.params.applicationId}`);
    }
  }
);

module.exports = router;