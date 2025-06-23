import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Insert a backfilled initial sync lookup tick
  // the source_start_tick is -1
  // and the source_end_tick is the closest sync_lookup updated_at_sync_tick to the minimum source_start_tick
  // If there is already a sync_lookup_tick with source_start_tick of -1 we can skip the insert
  await query.sequelize.query(`
    INSERT INTO sync_lookup_ticks (source_start_tick, lookup_end_tick)
    SELECT -1, COALESCE(
      (SELECT MAX(sl.updated_at_sync_tick) 
       FROM sync_lookup sl 
       WHERE sl.updated_at_sync_tick < (SELECT MIN(source_start_tick) FROM sync_lookup_ticks)
       AND sl.updated_at_sync_tick IS NOT NULL),
      (SELECT MIN(source_start_tick) FROM sync_lookup_ticks)
    )
    ON CONFLICT (source_start_tick, source_end_tick) DO NOTHING;
  `);
}

export async function down(_query: QueryInterface): Promise<void> {
  // Do nothing
}
