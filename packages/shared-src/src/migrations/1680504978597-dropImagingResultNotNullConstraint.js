import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('imaging_results', 'description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn('imaging_results', 'description', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
}
