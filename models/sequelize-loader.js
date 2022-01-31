'use strict';

const { Sequelize, DataTypes } = require('sequelize');

const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

const sequelize = process.env.DATABASE_URL ?
  new Sequelize(process.env.DATABASE_URL, {
    define: { freezeTableName: true },
    logging: false,
    dialectOptions
  })
  :
  new Sequelize('postgres://postgres:postgres@db/webapps', {
    define: { freezeTableName: true },
    logging: false
  });

module.exports = { sequelize, DataTypes };