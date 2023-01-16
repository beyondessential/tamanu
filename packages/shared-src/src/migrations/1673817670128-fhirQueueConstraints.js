import { DataTypes } from 'sequelize';

const TABLE_NAME = 'fhir_materialise_jobs';

export async function up(query) {
  await query.changeColumn(TABLE_NAME, 'upstream_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.changeColumn(TABLE_NAME, 'resource', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

export async function down(query) {
  await query.changeColumn(TABLE_NAME, 'resource', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.changeColumn(TABLE_NAME, 'upstream_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
