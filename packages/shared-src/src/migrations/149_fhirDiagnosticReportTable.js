import Sequelize from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'diagnostic_reports' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    version_id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    upstream_id: {
      type: Sequelize.STRING(36),
      allowNull: false,
    },
    last_updated: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    extension: {
      type: 'fhir.extension[]',
      allowNull: false,
      defaultValue: '{}',
    },
    identifier: {
      type: 'fhir.identifier[]',
      allowNull: false,
      defaultValue: '{}',
    },
    status: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    code: {
      type: 'fhir.codeable_concept',
      allowNull: false,
    },
    subject: {
      type: 'fhir.reference',
      allowNull: true,
    },
    effective_date_time: {
      type: 'date_time_string',
      allowNull: true,
    },
    issued: {
      type: 'date_time_string',
      allowNull: true,
    },
    performer: {
      type: 'fhir.reference[]',
      allowNull: false,
      defaultValue: '{}',
    },
    result: {
      type: 'fhir.reference[]',
      allowNull: false,
      defaultValue: '{}',
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id']);

  await query.sequelize.query(`
    CREATE TRIGGER versioning BEFORE UPDATE ON fhir.${TABLE.tableName}
    FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning()
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP TRIGGER versioning ON fhir.${TABLE.tableName}`);

  await query.dropTable(TABLE);
}
