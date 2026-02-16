import { QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const ISO8601_DATE_FMT_REGEXP =
  '(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d.\\d+([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))';

export async function up(query) {
  const countResult = await query.sequelize.query(
    `
    SELECT COUNT(*) FROM survey_response_answers
    WHERE body ~ '${ISO8601_DATE_FMT_REGEXP}';
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (parseInt(countResult[0].count, 10) === 0) {
    // Skipping migration of survey_response_answers.body dates as no relevant data
    return;
  }

  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  await query.sequelize.query(
    `
  UPDATE survey_response_answers
  SET
      body_legacy = body,
      body = COALESCE(TO_CHAR(body::TIMESTAMPTZ AT TIME ZONE '${PRIMARY_TIME_ZONE}', '${ISO9075_DATE_TIME_FMT}'), body)
  WHERE body ~ '${ISO8601_DATE_FMT_REGEXP}';
`,
  );
}
export async function down(query) {
  await query.sequelize.query(
    `
  UPDATE survey_response_answers
  SET
      body = COALESCE(body_legacy, body)
  WHERE body ~ '${ISO8601_DATE_FMT_REGEXP}';
`,
  );
}
