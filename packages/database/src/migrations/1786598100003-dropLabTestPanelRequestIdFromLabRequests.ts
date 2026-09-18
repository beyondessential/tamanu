import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_requests', 'lab_test_panel_request_id');

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_requests');`);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the column comes back empty. The relocate migration's down step repopulates it
  // from the panel requests, but a request holding several panels cannot be represented here.
  await query.addColumn('lab_requests', 'lab_test_panel_request_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'lab_test_panel_requests',
      key: 'id',
    },
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_requests');`);
}
