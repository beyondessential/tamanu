import Sequelize from 'sequelize';
import config from 'config';

const TABLE = { schema: 'fhir', tableName: 'immunizations' };

export async function up(query) {
  if (config.serverFacilityId) return;

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
    identifier: {
      type: 'fhir.identifier[]',
      allowNull: false,
      defaultValue: '{}',
    },
    status: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    vaccine_code: {
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
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
}

export async function down(query) {
  if (config.serverFacilityId) return;

  await query.dropTable(TABLE);
}
