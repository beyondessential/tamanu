import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('procedures', 'quantity', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('procedures', 'quantity');
}
