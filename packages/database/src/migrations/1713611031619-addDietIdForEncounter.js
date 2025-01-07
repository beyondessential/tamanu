import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'diet_id', {
    type: DataTypes.TEXT,
    allowNull: true,
    references: {
      model: 'reference_data',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('encounters', 'diet_id');
}
