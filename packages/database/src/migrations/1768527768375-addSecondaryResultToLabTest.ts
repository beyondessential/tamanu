import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'secondary_result', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('lab_tests');`);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: This will not restore the original secondary_result values
  await query.removeColumn('lab_tests', 'secondary_result');
}
