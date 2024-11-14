import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('appointments', 'is_high_priority', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query) {
  await query.removeColumn('appointments', 'is_high_priority');
}