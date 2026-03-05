import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

function getSystemTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getConfigTimeZone(config) {
  return config.primaryTimeZone;
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
    const health = await remote.fetch('health',
      {
        timeout: 2000,
        backoff: { maxAttempts: 1 },
        preserveBackoffForAuthAttempt: true,
      },
    );
    const { primaryTimeZone } = health.config;
    return primaryTimeZone;
  } catch (error) {
    log.warn('Unable to grab primaryTimeZone from central server.');
  }

  return null;
}

export async function performTimeZoneChecks({ config, sequelize, remote }) {
  const zones = {
    system: getSystemTimeZone(),
    config: getConfigTimeZone(config),
    database: await getDatabaseTimeZone(sequelize),
  };

  if (remote) {
    zones.remoteConfig = await getRemoteTimeZone(remote);
  }

  /*
  TODO: 
  When Sequelize connects to Postgres without an explicit timezone parameter, it causes 
  it to report its timezone slightly weirdly (as '<+00>-00' rather than a named TZ).
  But providing the timezone explicitly breaks some of our reports...! 
  So just log the timezones for now and we perform the more rigid check once
  we've sorted those issues out.
  */
  log.info('Checking timezone consistency', zones);
  /*
  const unique = new Set(Object.values(zones));
  if (unique.size > 1) {
    const errorText = `Detected mismatched time zones. Details: ${JSON.stringify(zones)}.`;
    if (config.allowMismatchedTimeZones) {
      log.warn(errorText);
    } else {
      throw new InvalidConfigError(
        `${errorText} Please ensure these are consistent, or set config.allowMismatchedTimeZones to true.`,
      );
    }
  }
  */
}
