import { Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'service_requests' };

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
    identifier: {
      type: 'fhir.identifier[]',
      allowNull: false,
      defaultValue: '{}',
    },
    status: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    intent: {
      type: Sequelize.STRING(16),
      allowNull: false,
    },
    category: {
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
    },
    priority: {
      type: Sequelize.STRING(10),
      allowNull: true,
    },
    order_detail: {
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
    occurrence_date_time: {
      type: 'date_time_string',
      allowNull: true,
    },
    requester: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { schema: 'fhir', tableName: 'practitioners' },
        key: 'id',
      },
    },
    location_code: {
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id']);
}

export async function down(query) {
  await query.dropTable(TABLE);
}
