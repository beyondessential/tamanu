export async function up(query) {
  await query.sequelize.query(
    'CREATE INDEX IF NOT EXISTS idx_appointments_schedule_id_start_time_desc ON appointments (schedule_id, start_time DESC);',
  );
  await query.sequelize.query(
    'CREATE INDEX IF NOT EXISTS idx_appointment_schedules_is_fully_generated ON appointment_schedules (is_fully_generated);',
  );
}

export async function down(query) {
  await query.sequelize.query('DROP INDEX IF EXISTS idx_appointment_schedules_is_fully_generated;');
  await query.sequelize.query('DROP INDEX IF EXISTS idx_appointments_schedule_id_start_time_desc;');
}
