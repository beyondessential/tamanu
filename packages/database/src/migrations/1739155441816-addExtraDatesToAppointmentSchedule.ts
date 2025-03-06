/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('appointment_schedules', 'generated_until_date', {
    type: DataTypes.DATESTRING,
  });
  await query.addColumn('appointment_schedules', 'cancelled_at_date', {
    type: DataTypes.DATESTRING,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('appointment_schedules', 'generated_until_date');
  await query.removeColumn('appointment_schedules', 'cancelled_at_date');
}
