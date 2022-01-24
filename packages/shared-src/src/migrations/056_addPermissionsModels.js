const Sequelize = require('sequelize');

const basics = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  deleted_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
};

module.exports = {
  up: async query => {
    await query.createTable('roles', {
      ...basics,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    await query.createTable('permissions', {
      ...basics,
      noun: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      verb: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      objectId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  down: async query => {
    await query.dropTable('roles');
    await query.dropTable('permissions');
  },
};
