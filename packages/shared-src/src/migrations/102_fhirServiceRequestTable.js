import { Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'service_requests' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    version_id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
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
    // subject
    occurrence_date_time: {
      type: Sequelize.DATETIMESTRING,
      allowNull: true,
    },
    // requester
    location_code: {
      type: 'fhir.codeable_concept[]',
      allowNull: false,
      defaultValue: '{}',
    },
  });
}

export async function down(query) {
  await query.dropTable(TABLE);
}
