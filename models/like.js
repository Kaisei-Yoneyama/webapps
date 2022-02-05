'use strict';

const { sequelize, DataTypes } = require('./sequelize-loader');

const Like = sequelize.define('likes', {
  applicationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = Like;