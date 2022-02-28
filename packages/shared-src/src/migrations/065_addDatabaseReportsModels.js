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
    await query.createTable('report_definitions', {
      ...basics,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    await query.createTable('report_definition_versions', {
      ...basics,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        default: 'draft',
      },
      query: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      options: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      definition_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: { model: 'report_definitions', key: 'id' },
      },
    });
  },
  down: async query => {
    await query.dropTable('report_definition_versions');
    await query.dropTable('report_definitions');
  },
};
