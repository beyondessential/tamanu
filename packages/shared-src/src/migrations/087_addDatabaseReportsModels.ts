import { STRING, DATE, NOW, UUIDV4, QueryInterface } from 'sequelize';

const basics = {
  id: {
    type: STRING,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  createdAt: {
    type: DATE,
    defaultValue: NOW,
  },
  updatedAt: {
    type: DATE,
    defaultValue: NOW,
  },
  deletedAt: {
    type: DATE,
    defaultValue: NOW,
  },
};

export async function up(query: QueryInterface) {
  // Add Report Definition Table
  await query.createTable('report_definitions', {
    ...basics,
    name: {
      type: STRING,
      allowNull: false,
    },
  });

  // Add Report Definition Version Table
  await query.createTable('report_definition_versions', {
    ...basics,
    name: {
      type: STRING,
      allowNull: false,
    },
    notes: {
      type: STRING,
      allowNull: true,
    },
    status: {
      type: STRING,
      allowNull: false,
      default: 'draft',
    },
    query: {
      type: STRING,
      allowNull: true,
    },
    options: {
      type: STRING,
      allowNull: true,
    },
    definition_id: {
      type: STRING,
      allowNull: true,
      references: { model: 'report_definitions', key: 'id' },
    },
    userId: {
      type: STRING,
      references: { model: 'user', key: 'id' },
      allowNull: false,
    },
  });

  // Update Existing Report Request Table
  await query.addColumn('report_requests', 'facility_id', {
    type: STRING,
    allowNull: true,
    references: { model: 'facilities', key: 'id' },
  });

  await query.addColumn('report_requests', 'legacy_report_id', {
    type: STRING,
    allowNull: true,
  });

  await query.addColumn('report_requests', 'version_id', {
    type: STRING,
    allowNull: true,
    references: { model: 'report_definition_versions', key: 'id' },
  });

  await query.sequelize.query(`
      UPDATE report_requests
      SET legacy_report_id = report_type
    `);

  await query.removeColumn('report_requests', 'report_type');
}

export async function down(query: QueryInterface) {
  // Undo Updates to Report Requests Table

  // Adding a non-nullable column will fail if there are records in the db
  await query.addColumn('report_requests', 'report_type', {
    type: STRING,
    allowNull: false,
    default: 'DEFAULT_REPORT_TYPE',
  });
  await query.sequelize.query(`
      UPDATE report_requests
      SET report_type = legacy_report_id
    `);
  // Removing the default value
  await query.changeColumn('report_requests', 'report_type', {
    type: STRING,
    allowNull: false,
  });

  // Remove Report Definition Table
  await query.dropTable('report_definition_versions');
  // Remove Report Definition Version Table
  await query.dropTable('report_definitions');
}
