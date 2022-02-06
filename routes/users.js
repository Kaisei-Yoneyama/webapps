'use strict';

const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Application = require('../models/application');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const createError = require('http-errors');

// ユーザーページ
router.get(
  '/:userName',
  (req, res, next) => {
    // 指定されたユーザーを取得する
    User.findOne({
      where: {userName: req.params.userName}
    }).then((user) => {
      if (user) {
        // ユーザーのすべてのアプリを取得する
        Application.findAll({
          where: { userId: user.userId },
          order: [['createdAt', 'DESC']]
        }).then((applications) => {
          // 投稿日時のフォーマット
          applications.forEach((application) => {
            application.formattedCreatedAt = dayjs(application.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
            application.formattedUpdatedAt = dayjs(application.updatedAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
          });

          return res.render('user', {
            applications: applications,
            developer: user,
            user: req.user
          });
        }).catch(next);
      } else {
        next(createError(404));
      }
    }).catch(next);
  });


module.exports = router;