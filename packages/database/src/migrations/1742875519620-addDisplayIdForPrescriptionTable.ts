import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('prescriptions', 'display_id', {
    type: DataTypes.STRING,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('prescriptions', 'display_id');
}
