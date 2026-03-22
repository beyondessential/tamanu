import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('assets', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('assets', 'facility_id');
}
