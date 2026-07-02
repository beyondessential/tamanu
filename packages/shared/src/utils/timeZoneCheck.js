import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

/**
 * The server's primary timezone (IANA) for all stored datetimes, from the standard
 * TZ env var (which deployments already set). Falls back to the system timezone —
 * the same thing Node's Date uses when TZ is unset — so the process clock and the
 * app-level primary timezone always agree.
 */
export function getPrimaryTimeZone() {
  return process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getSystemTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

async function getDatabaseTimeZone(sequelize) {
  const rows = await sequelize.query(
    "SELECT setting FROM pg_settings WHERE name ILIKE 'timezone'",
    {
      type: QueryTypes.SELECT,
    },
  );
  return rows[0].setting;
}

export async function performTimeZoneChecks({ sequelize }) {
  const zones = {
    system: getSystemTimeZone(),
    primary: getPrimaryTimeZone(),
    database: await getDatabaseTimeZone(sequelize),
  };

  /*
  TODO:
  When Sequelize connects to Postgres without an explicit timezone parameter, it causes
  it to report its timezone slightly weirdly (as '<+00>-00' rather than a named TZ).
  But providing the timezone explicitly breaks some of our reports...!
  So just log the timezones for now and we perform the more rigid check once
  we've sorted those issues out.
  */
  log.info('Checking timezone consistency', zones);
}
