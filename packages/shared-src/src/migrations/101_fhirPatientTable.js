import { Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'patients' };

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
    gender: {
      type: Sequelize.STRING(10),
      allowNull: false,
    },
    birth_date: {
      type: Sequelize.DATESTRING,
      allowNull: true,
    },
    deceased_date_time: {
      type: Sequelize.DATESTRING,
      allowNull: true,
    },
    address: {
      type: 'fhir.address[]',
      allowNull: false,
      defaultValue: '{}',
    },
  });
}

export async function down(query) {
  await query.dropTable(TABLE);
}
