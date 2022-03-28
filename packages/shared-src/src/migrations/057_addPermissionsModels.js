const Sequelize = require('sequelize');

const basics = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  deletedAt: {
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
      roleId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
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
