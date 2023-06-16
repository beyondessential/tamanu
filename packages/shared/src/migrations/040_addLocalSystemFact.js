const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('local_system_facts', {
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
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
    await query.addIndex('local_system_facts', {
      fields: ['key'],
      unique: true,
    });
  },
  down: async query => {
    // index is automatically removed when the table is dropped
    await query.dropTable('local_system_facts');
  },
};
