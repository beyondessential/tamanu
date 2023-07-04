import config from 'config';
import { Sequelize } from 'sequelize';

const SCHEMA = 'fhir';
const TABLES = ['patients', 'diagnostic_reports', 'immunizations', 'service_requests'];

export async function up(query) {
  // Central only
  if (config.serverFacilityId) return;

  const COUNTRY_TIMEZONE = config?.countryTimeZone;
  if (!COUNTRY_TIMEZONE) {
    throw Error('A countryTimeZone must be configured in local.json for this migration to run.');
  }

  await query.sequelize.query(`SET TIME ZONE '${COUNTRY_TIMEZONE}'`);

  for (const tableName of TABLES) {
    await query.changeColumn({ schema: SCHEMA, tableName }, 'last_updated', {
      type: 'timestamp',
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false,
    });
  }
}

export async function down(query) {
  // Central only
  if (config.serverFacilityId) return;

  const COUNTRY_TIMEZONE = config?.countryTimeZone;
  if (!COUNTRY_TIMEZONE) {
    throw Error('A countryTimeZone must be configured in local.json for this migration to run.');
  }

  await query.sequelize.query(`SET TIME ZONE '${COUNTRY_TIMEZONE}'`);

  for (const tableName of TABLES) {
    await query.changeColumn({ schema: SCHEMA, tableName }, 'last_updated', {
      type: 'timestamptz',
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false,
    });
  }
}
