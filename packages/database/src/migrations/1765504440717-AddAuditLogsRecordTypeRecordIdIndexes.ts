import { QueryInterface } from 'sequelize';
import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export async function up(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(selectFacilityIds(config));

  // We still need changes_record_id index for the facility server
  // and changes_table_name_record_id index only benefits central server for pulling change logs.
  // Hence, skip the migration if this is a facility server
  if (isFacility) {
    return;
  }

  await query.sequelize.query(`
    DROP INDEX IF EXISTS logs.changes_record_id;

    CREATE INDEX changes_table_name_record_id
    ON logs.changes(table_name, record_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(selectFacilityIds(config));

  if (isFacility) {
    return;
  }

  await query.sequelize.query(`
    DROP INDEX IF EXISTS logs.changes_table_name_record_id;

    CREATE INDEX changes_record_id 
    ON logs.changes 
    USING hash (record_id);
  `);
}
