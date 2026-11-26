import { QueryInterface } from 'sequelize';
import config from 'config';
import { facilityIdsFromEnv, selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

// Serves the data team's reads of a single table's changes over a logged_at window. The BRIN index
// on logged_at alone makes those read every table's changes in the window and filter afterwards.
// Central only: facility servers never serve these reads, and every audited write pays for the index.
export async function up(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(facilityIdsFromEnv() ?? selectFacilityIds(config));
  if (isFacility) {
    return;
  }

  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS changes_table_name_logged_at
    ON logs.changes (table_name, logged_at);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(facilityIdsFromEnv() ?? selectFacilityIds(config));
  if (isFacility) {
    return;
  }

  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_table_name_logged_at;`);
}
