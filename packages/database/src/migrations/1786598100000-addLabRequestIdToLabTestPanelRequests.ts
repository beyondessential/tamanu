import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_test_panel_requests', 'lab_request_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'lab_requests',
      key: 'id',
    },
  });

  await query.addIndex('lab_test_panel_requests', ['lab_request_id']);

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_test_panel_requests');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_test_panel_requests', 'lab_request_id');

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_test_panel_requests');`);
}
