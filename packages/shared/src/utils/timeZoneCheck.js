import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

/**
 * The server's primary timezone (IANA) for all stored datetimes, from the
 * TAMANU_PRIMARY_TIMEZONE env var. Defaults to Australia/Melbourne when unset.
 *
 * A dedicated var (rather than the standard `TZ`) is deliberate: `TZ` also changes
 * Node's process-wide Date/Intl behaviour, which would couple our app-level primary
 * timezone to the OS clock and shift datetime-sensitive code/tests that assume the
 * process runs in UTC. Keeping it separate makes this a non-breaking config→env move.
 */
export function getPrimaryTimeZone() {
  return process.env.TAMANU_PRIMARY_TIMEZONE ?? 'Australia/Melbourne';
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
