const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('attachments', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: Sequelize.STRING(31),
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      data: {
        type: Sequelize.BLOB,
        allowNull: false,
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
    });
  },
  down: async query => {
    await query.dropTable('attachments');
  },
};
