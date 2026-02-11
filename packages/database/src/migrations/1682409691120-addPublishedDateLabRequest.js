import { DataTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
export async function up(query) {
  const GLOBAL_TIME_ZONE = config?.globalTimeZone;

  if (!GLOBAL_TIME_ZONE) {
    throw Error('A globalTimeZone must be configured in local.json for this migration to run.');
  }

  await query.addColumn('lab_requests', 'published_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
  await query.sequelize.query(`
  UPDATE lab_requests
    SET published_date = TO_CHAR(lrl.created_at::TIMESTAMPTZ AT TIME ZONE '${GLOBAL_TIME_ZONE}', '${ISO9075_DATE_TIME_FMT}')
    FROM lab_request_logs lrl
    WHERE lrl.lab_request_id = lab_requests.id AND lrl.status = 'published';
  `);
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'published_date');
}
