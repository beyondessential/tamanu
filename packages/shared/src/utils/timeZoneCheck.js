import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

function getSystemTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getConfigTimeZone(config) {
  return config.countryTimeZone;
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
// otherwise default to the latest seen
async function getRemoteTimeZone(remote, models) {
  const { LocalSystemFact } = models;
  try {
    const health = await remote.fetch('health');
    const { countryTimeZone } = health.config;
    await LocalSystemFact.set('lastCentralServerCountryTimeZone', countryTimeZone);
    return countryTimeZone;
  } catch (error) {
    log.info('Unable to grab countryTimeZone from central server.');
  }

  const lastCentralServerCountryTimeZone = await LocalSystemFact.get(
    'lastCentralServerCountryTimeZone',
  );

  return lastCentralServerCountryTimeZone;
}

export async function performTimeZoneChecks({ config, sequelize, remote, models }) {
  const zones = {
    system: getSystemTimeZone(),
    config: getConfigTimeZone(config),
    database: await getDatabaseTimeZone(sequelize),
  };

  if (remote) {
    zones.remoteConfig = await getRemoteTimeZone(remote, models);
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
