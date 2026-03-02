import config from 'config';
import { Sequelize } from 'sequelize';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

const SCHEMA = 'fhir';
const TABLES = ['patients', 'diagnostic_reports', 'immunizations', 'service_requests'];

export async function up(query) {
  // Central only
  const isFacilityServer = !!selectFacilityIds(config);
  if (isFacilityServer) return;

  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;
  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  await query.sequelize.query(`SET TIME ZONE '${PRIMARY_TIME_ZONE}'`);

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
  const isFacilityServer = !!selectFacilityIds(config);
  if (isFacilityServer) return;

  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;
  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  await query.sequelize.query(`SET TIME ZONE '${PRIMARY_TIME_ZONE}'`);

  for (const tableName of TABLES) {
    await query.changeColumn({ schema: SCHEMA, tableName }, 'last_updated', {
      type: 'timestamptz',
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false,
    });
  }
}
