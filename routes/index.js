'use strict';

const express = require('express');
const router = express.Router();

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const {sequelize} = require('../models/sequelize-loader');
const Application = require('../models/application');
const User = require('../models/user');

/* GET home page. */
router.get('/', async (req, res, next) => {
  // 登録されているすべてのアプリを取得する
  const applications = await Application.findAll({
    include: [{ model: User, attributes: ['userId', 'userName', 'displayName'] }],
    order: sequelize.random() // ランダムに並べ替える
  });

  // 投稿日時のフォーマット
  applications.forEach((application) => {
    application.formattedCreatedAt = dayjs(application.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
    application.formattedUpdatedAt = dayjs(application.updatedAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
  });

  res.render('index', {
    user: req.user,
    applications
  });
});

module.exports = router;
