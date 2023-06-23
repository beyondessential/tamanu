import { STRING, DATE, BOOLEAN, NOW, UUIDV4, INTEGER, JSON, TEXT } from 'sequelize';

const REPORT_STATUSES = { DRAFT: 'draft', PUBLISHED: 'published' };

const basics = {
  id: {
    type: STRING,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: DATE,
    defaultValue: NOW,
  },
  updated_at: {
    type: DATE,
    defaultValue: NOW,
  },
  deleted_at: {
    type: DATE,
    defaultValue: NOW,
  },
};

const syncColumns = {
  marked_for_push: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_pushing: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  pushed_at: {
    type: DATE,
    allowNull: true,
  },
  pulled_at: {
    type: DATE,
    allowNull: true,
  },
};

export async function up(query) {
  // Add Report Definition Table
  await query.createTable('report_definitions', {
    ...basics,
    ...syncColumns,
    name: {
      type: STRING,
      allowNull: false,
    },
  });

  // Add Report Definition Version Table
  await query.createTable('report_definition_versions', {
    ...basics,
    ...syncColumns,
    version_number: {
      type: INTEGER,
      allowNull: false,
    },
    notes: {
      type: STRING,
      allowNull: true,
    },
    status: {
      type: STRING,
      allowNull: false,
      defaultValue: REPORT_STATUSES.DRAFT,
    },
    query: {
      type: TEXT,
      allowNull: true,
    },
    query_options: {
      type: JSON,
      allowNull: true,
    },
    report_definition_id: {
      type: STRING,
      allowNull: true,
      references: { model: 'report_definitions', key: 'id' },
    },
    user_id: {
      type: STRING,
      references: { model: 'users', key: 'id' },
      allowNull: false,
    },
  });

  // Update Existing Report Request Table
  await query.addColumn('report_requests', 'facility_id', {
    type: STRING,
    allowNull: true,
    references: { model: 'facilities', key: 'id' },
  });

  await query.addColumn('report_requests', 'export_format', {
    type: STRING,
    allowNull: false,
    defaultValue: 'xlsx',
  });

  await query.addColumn('report_requests', 'report_definition_version_id', {
    type: STRING,
    allowNull: true,
    references: { model: 'report_definition_versions', key: 'id' },
  });

  await query.changeColumn('report_requests', 'report_type', {
    type: STRING,
    allowNull: true,
  });
}

export async function down(query) {
  // Undo Updates to Report Requests Table
  await query.removeColumn('report_requests', 'facility_id');
  await query.removeColumn('report_requests', 'report_definition_version_id');

  // Remove Report Definition Table
  await query.dropTable('report_definition_versions');
  // Remove Report Definition Version Table
  await query.dropTable('report_definitions');
}
