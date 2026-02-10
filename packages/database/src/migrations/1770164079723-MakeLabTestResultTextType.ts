import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('lab_tests', 'result', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('lab_tests', 'result', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  });
}
