import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn({ schema: 'fhir', tableName: 'medication_requests' }, 'category', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn({ schema: 'fhir', tableName: 'medication_requests' }, 'category');
}
