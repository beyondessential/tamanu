import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('patients', 'test_column', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('patients', 'test_column');
}
