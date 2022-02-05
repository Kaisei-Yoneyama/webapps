'use strict';

const { sequelize, DataTypes } = require('./sequelize-loader');

const Application = sequelize.define('applications', {
  applicationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  applicationName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicationThumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicationDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  applicationUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicationRepository: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [ { fields: [ 'userId' ] } ]
});

module.exports = Application;