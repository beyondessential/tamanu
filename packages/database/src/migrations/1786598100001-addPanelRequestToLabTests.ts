import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'lab_test_panel_request_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'lab_test_panel_requests',
      key: 'id',
    },
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_tests');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_tests', 'lab_test_panel_request_id');

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_tests');`);
}
