import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

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

// Try to grab current remote time zone
// otherwise ignore that one
async function getRemoteTimeZone(remote) {
  try {
    const health = await remote.fetch('health', { timeout: 2000, backoff: { maxAttempts: 1 } });
    const { countryTimeZone } = health.config;
    return countryTimeZone;
  } catch (error) {
    log.warn('Unable to grab countryTimeZone from central server.');
  }

  return null;
}

export async function performTimeZoneChecks({ countryTimeZone, sequelize, remote }) {
  const zones = {
    system: getSystemTimeZone(),
    config: countryTimeZone,
    database: await getDatabaseTimeZone(sequelize),
  };

  if (remote) {
    zones.remoteConfig = await getRemoteTimeZone(remote);
  }

  /*
  The orginal check below was disabled as Sequelize connects to Postgres without an explicit timezone parameter,
  it causes it to report its timezone slightly weirdly (as '<+00>-00' rather than a named TZ).
  But providing the timezone explicitly breaks some of our reports...! 
  It likely should be reinstated at some point. but we fixed all of the problems 
  that it was originally checking for so it's not urgent.
  */
  log.info('Checking timezone consistency', zones);
}
