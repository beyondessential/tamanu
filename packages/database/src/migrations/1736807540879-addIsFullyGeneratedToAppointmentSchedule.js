import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('appointment_schedules', 'is_fully_generated', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query) {
  await query.removeColumn('appointment_schedules', 'is_fully_generated');
}
