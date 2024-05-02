import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('surveys', 'visibility_status', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'current',
  });
}

export async function down(query) {
  await query.removeColumn('surveys', 'visibility_status');
}
