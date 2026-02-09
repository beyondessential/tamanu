import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_requests', 'lab_test_panel_request_id');
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: This will restore the column but all values will be null
  const { DataTypes } = await import('sequelize');
  await query.addColumn('lab_requests', 'lab_test_panel_request_id', {
    type: DataTypes.UUID,
    references: {
      model: 'lab_test_panel_requests',
      key: 'id',
    },
    allowNull: true,
  });
}
