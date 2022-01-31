'use strict';

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./ensure');
const Comment = require('../models/comment');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// 投稿
router.post(
  '/:applicationId/comments',
  ensureAuthenticated,
  csrfProtection,
  (req, res, next) => {
    if (req.body.comment) {
      Comment.create({
        userId: req.user.userId,
        applicationId: req.params.applicationId,
        comment: req.body.comment.slice(0, 200)
      }).then((comment) => {
        res.redirect(`/applications/${comment.applicationId}`);
      }).catch(next);
    } else {
      res.redirect(`/applications/${req.params.applicationId}`);
    }
  }
);

// 削除
router.post(
  '/:applicationId/comments/:commentId',
  ensureAuthenticated,
  csrfProtection,
  (req, res, next) => {
    if (parseInt(req.query.delete) === 1) {
      Comment.findByPk(req.params.commentId).then((comment) => {
        if (comment && comment.userId === req.user.userId) {
          comment.destroy().then(() => {
            res.redirect(`/applications/${req.params.applicationId}`);
          }).catch(next);
        }
      });
    } else {
      res.redirect(`/applications/${req.params.applicationId}`);
    }
  }
);

module.exports = router;