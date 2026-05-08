import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'lab_test_panel_request_id', {
    type: DataTypes.UUID,
    references: {
      model: 'lab_test_panel_requests',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'lab_test_panel_request_id');
}
