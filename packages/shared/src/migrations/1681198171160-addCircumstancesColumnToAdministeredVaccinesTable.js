import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'circumstance_ids', {
    type: DataTypes.ARRAY(DataTypes.STRING),
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'circumstance_ids');
}
