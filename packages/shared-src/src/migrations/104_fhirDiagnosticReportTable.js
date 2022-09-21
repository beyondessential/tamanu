import Sequelize from 'sequelize';
import config from 'config';

const TABLE = { schema: 'fhir', tableName: 'diagnostic_reports' };

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
    extension: {}, // TODO: figure out wth is this. Also should it be a one off or should we make an extra parent DomainResource?
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
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
    },
    subject: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: { schema: 'fhir', tableName: 'patients' },
        key: 'id',
      },
    },
    effective_date_time: {
      type: 'date_time_string',
      allowNull: true,
    },
    issued: {
      type: 'date_time_string',
      allowNull: true,
    },
    performer: {}, // TODO: should have its own type?
    result: {}, // TODO: how to handle without an "observations" table?
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id']);
}

export async function down(query) {
  if (config.serverFacilityId) return;

  await query.dropTable(TABLE);
}
