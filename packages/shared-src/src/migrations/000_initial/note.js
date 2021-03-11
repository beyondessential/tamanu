const Sequelize = require('sequelize');

module.exports = {

  name: 'User',

  fields: {
    recordId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    recordType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    noteType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    },
  },

}
