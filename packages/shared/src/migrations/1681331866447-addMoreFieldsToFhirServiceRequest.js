import { DataTypes } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'service_requests' };

export async function up(query) {
  await query.addColumn(TABLE, 'contained', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'encounter', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'note', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn(TABLE, 'contained');
  await query.removeColumn(TABLE, 'encounter');
  await query.removeColumn(TABLE, 'note');
}
