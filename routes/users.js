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

// 表示
router.get(
  '/:userName',
  (req, res, next) => {
    User.findOne({
      where: {userName: req.params.userName}
    }).then((user) => {
      if (user) {
        Application.findAll({
          where: { userId: user.userId },
          order: [['createdAt', 'DESC']]
        }).then((applications) => {
          applications.forEach((application) => {
            application.formattedCreatedAt = dayjs(application.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
            application.formattedUpdatedAt = dayjs(application.updatedAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
          });
          return res.render('user', {
            applications: applications,
            user: user
          });
        }).catch(next);
      } else {
        const error = new Error('指定されたユーザーは存在しません');
        error.status = 404;
        next(error);
      }
    }).catch(next);
  });


module.exports = router;