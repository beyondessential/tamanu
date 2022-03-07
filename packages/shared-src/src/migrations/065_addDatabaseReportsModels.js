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
    await query.addColumn('report_requests', 'facility_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'facilities', key: 'id' },
    });
    await query.addColumn('report_requests', 'legacy_report_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await query.addColumn('report_requests', 'version_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'report_definition_versions', key: 'id' },
    });
    await query.sequelize.query(`
      UPDATE report_requests
      SET legacy_report_id = report_type
    `);
    await query.removeColumn('report_requests', 'report_type');
  },
  down: async query => {
    // Adding a non-nullable column will fail if there are records in the db
    await query.addColumn('report_requests', 'report_type', {
      type: Sequelize.STRING,
      allowNull: false,
      default: 'DEFAULT_REPORT_TYPE',
    });
    await query.sequelize.query(`
      UPDATE report_requests
      SET report_type = legacy_report_id
    `);
    // Removing the default value
    await query.changeColumn('report_requests', 'report_type', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await query.removeColumn('report_requests', 'version_id');
    await query.removeColumn('report_requests', 'legacy_report_id');
    await query.removeColumn('report_requests', 'facility_id');

    await query.dropTable('report_definition_versions');
    await query.dropTable('report_definitions');
  },
};
