import { DataTypes } from 'sequelize';

const TABLE_NAME = 'fhir_materialise_jobs';
const COLUMN_NAME = 'priority';

export async function up(query) {
  await query.addColumnn(TABLE_NAME, COLUMN_NAME, {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(query) {
  await query.dropColumnn(TABLE_NAME, COLUMN_NAME);
}
