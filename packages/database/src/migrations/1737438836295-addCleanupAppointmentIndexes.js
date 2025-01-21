export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX idx_appointments_status_start_time_schedule_id ON appointments (status, start_time, schedule_id);
  `);
  await query.sequelize.query(`
    CREATE INDEX idx_appointment_schedules_id_until_date ON appointment_schedules (id, until_date);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX idx_appointments_status_start_time_schedule_id;
  `);
  await query.sequelize.query(`
    DROP INDEX idx_appointment_schedules_id_until_date;
  `);
}
