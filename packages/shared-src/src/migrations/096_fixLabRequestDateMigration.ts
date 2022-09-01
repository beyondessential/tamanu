import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query(
    `UPDATE lab_requests
        SET sample_time = to_char(sample_time_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
        WHERE sample_time = to_char(sample_time_legacy, 'YYYY-MM-DD HH24:MI:SS')
        OR sample_time = to_char(sample_time_legacy, 'YYYY-MM-DD HH:mm:ss');
  `,
  );
  await query.sequelize.query(
    `UPDATE lab_requests
        SET requested_date = to_char(requested_date_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
        WHERE requested_date = to_char(requested_date_legacy, 'YYYY-MM-DD HH24:MI:SS')
        OR sample_time = to_char(sample_time_legacy, 'YYYY-MM-DD HH:mm:ss');
  `,
  );
}

export async function down() {
  // No down as is a data correction
}
