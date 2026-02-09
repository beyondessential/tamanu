import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_test_panel_requests', 'lab_request_id', {
    type: DataTypes.UUID,
    references: {
      model: 'lab_requests',
      key: 'id',
    },
    allowNull: true, // Temporarily allow null during migration
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: This will not restore the original relationship structure
  await query.removeColumn('lab_test_panel_requests', 'lab_request_id');
}
