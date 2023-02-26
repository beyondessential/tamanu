import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'lab_panel_request_id', {
    type: DataTypes.STRING,
    references: {
      model: 'lab_panel_requests',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'lab_panel_request_id');
}
