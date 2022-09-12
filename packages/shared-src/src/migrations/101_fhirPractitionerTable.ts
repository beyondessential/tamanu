import Sequelize, { QueryInterface } from 'sequelize';
import config from 'config';

const TABLE = { schema: 'fhir', tableName: 'practitioners' };

export async function up(query: QueryInterface): Promise<void> {
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
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    name: {
      type: 'fhir.human_name[]',
      allowNull: false,
      defaultValue: '{}',
    },
    telecom: {
      type: 'fhir.contact_point[]',
      allowNull: false,
      defaultValue: '{}',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  if (config.serverFacilityId) return;

  await query.dropTable(TABLE);
}
