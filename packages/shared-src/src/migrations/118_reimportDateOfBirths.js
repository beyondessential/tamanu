import config from 'config';

const ISO9075_DATE_FMT = 'YYYY-MM-DD';

export async function up(query) {
  const COUNTRY_TIMEZONE = config?.countryTimeZone;

  if (!COUNTRY_TIMEZONE) {
    throw Error('A countryTimeZone must be configured in local.json for this migration to run.');
  }

  await query.sequelize.query(`
    UPDATE patients
    SET date_of_birth = TO_CHAR(date_of_birth_legacy::TIMESTAMPTZ AT TIME ZONE '${COUNTRY_TIMEZONE}', '${ISO9075_DATE_FMT}')
    WHERE date_of_birth_legacy::time = '12:00:01';
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE patients
    SET date_of_birth = TO_CHAR(date_of_birth_legacy, '${ISO9075_DATE_FMT}')
    WHERE date_of_birth_legacy::time = '12:00:01';
  `);
}
