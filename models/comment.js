'use strict';

const { sequelize, DataTypes } = require('./sequelize-loader');

const Comment = sequelize.define('comments', {
  commentId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [{fields: ['userId', 'applicationId']}]
});

module.exports = Comment;