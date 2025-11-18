import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'result_interpretation', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_tests', 'result_interpretation');
}
