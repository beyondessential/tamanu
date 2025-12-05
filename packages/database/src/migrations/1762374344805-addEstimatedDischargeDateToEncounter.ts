import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('encounters', 'estimated_end_date', {
    type: DataTypes.DATESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('encounters', 'estimated_end_date');
}
