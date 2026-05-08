import Sequelize from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'immunizations' };

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
      type: Sequelize.STRING,
      allowNull: false,
    },
    last_updated: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    status: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    vaccine_code: {
      type: 'fhir.codeable_concept',
      allowNull: false,
    },
    patient: {
      type: 'fhir.reference',
      allowNull: false,
    },
    encounter: {
      type: 'fhir.reference',
      allowNull: true,
    },
    occurrence_date_time: {
      type: 'date_time_string',
      allowNull: true,
    },
    lot_number: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    site: {
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
    },
    performer: {
      type: 'fhir.immunization_performer[]',
      allowNull: false,
      defaultValue: '{}',
    },
    protocol_applied: {
      type: 'fhir.immunization_protocol_applied[]',
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
  await query.dropTable(TABLE);
}
