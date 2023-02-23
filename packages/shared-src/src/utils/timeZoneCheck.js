import { QueryTypes } from 'sequelize';
import { log } from '../services/logging';

class TimeZoneMismatchError extends Error {}

function getSystemTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getConfigTimeZone(config) {
  return config.countryTimeZone;
}

async function getDatabaseTimeZone(sequelize) {
  const rows = await sequelize.query("SELECT * FROM pg_settings WHERE name ILIKE 'timezone'", {
    type: QueryTypes.SELECT,
  });
  return rows[0].setting;
}

async function getRemoteTimeZone(remote) {
  const health = await remote.fetch('health');
  const { countryTimeZone } = health.config;
  return countryTimeZone;
}

export async function performTimeZoneChecks({ config, sequelize, remote }) {
  const zones = {
    system: getSystemTimeZone(),
    config: getConfigTimeZone(config),
    database: await getDatabaseTimeZone(sequelize),
  };

  if (remote) {
    zones.remote = await getRemoteTimeZone(remote);
  }

  const unique = new Set(Object.values(zones));
  if (unique.size > 1) {
    const errorText = `Detected mismatched time zones. Details: ${JSON.stringify(zones)}.`;
    if (config.allowMismatchedTimeZones) {
      log.warn(errorText);
    } else {
      throw new TimeZoneMismatchError(
        `${errorText} Please ensure these are consistent, or set config.allowMismatchedTimeZones to true.`,
      );
    }
  }
}
