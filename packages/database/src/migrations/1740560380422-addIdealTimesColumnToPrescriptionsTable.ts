import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('prescriptions', 'ideal_times', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('prescriptions', 'ideal_times');
}
