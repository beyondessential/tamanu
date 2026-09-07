import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'medication_requests', schema: 'fhir' };

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'reason_code', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'reason_code');
}
