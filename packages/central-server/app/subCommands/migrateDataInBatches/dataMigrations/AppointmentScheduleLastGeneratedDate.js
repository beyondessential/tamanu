import { CursorDataMigration } from '@tamanu/database/dataMigrations';

export class AppointmentScheduleLastGeneratedDate extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      WITH updated AS (
        UPDATE appointment_schedules
        SET generated_until_date = latest_appointment.start_time :: date_string
        FROM
          (
            SELECT
              appointments.schedule_id, MAX(appointments.start_time) AS start_time
            FROM appointments
            WHERE schedule_id IS NOT NULL
            GROUP BY schedule_id
          ) AS latest_appointment
        WHERE appointment_schedules.id = latest_appointment.schedule_id
          AND appointment_schedules.id IN (
            SELECT id
            FROM appointment_schedules
            ORDER BY id
            LIMIT $limit
          ) RETURNING id
      )
      SELECT MAX(id :: text) AS "maxId", COUNT(id) AS "count"
      FROM updated;
    `;
  }
}
