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
    allowNull: false
  },
  applicationThumbnail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  applicationUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationRepository: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [{fields: [ 'userId' ]}]
});

module.exports = Application;