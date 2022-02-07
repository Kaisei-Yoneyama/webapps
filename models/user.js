'use strict';

const { sequelize, DataTypes } = require('./sequelize-loader');

const User = sequelize.define('users', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  biography: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  timestamps: false,
  indexes: [ { fields: [ 'userName' ] } ]
});

module.exports = User;