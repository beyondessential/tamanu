import { QueryInterface } from 'sequelize';

// The changelog is a large, append-only table, so the default autovacuum and statistics settings
// serve it poorly. Analyse only fires after 10% of rows change, a threshold that grows with the
// table while the cost of ANALYZE does not, so statistics go stale for weeks. The insert-driven
// vacuum trigger (the only one that fires on an append-only table) defaults to 20% of rows, so the
// visibility map is essentially never set and index-only scans are unavailable. And record_data is
// jsonb, so ANALYZE detoasts every sampled value to build statistics that no predicate can use —
// every filter is a record_data->>'key' extraction, which never consults the column's MCV list.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE logs.changes SET (
      autovacuum_analyze_scale_factor = 0.02,
      autovacuum_vacuum_insert_scale_factor = 0.05
    );
  `);
  await query.sequelize.query(`ALTER TABLE logs.changes ALTER COLUMN record_data SET STATISTICS 0;`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE logs.changes RESET (
      autovacuum_analyze_scale_factor,
      autovacuum_vacuum_insert_scale_factor
    );
  `);
  await query.sequelize.query(
    `ALTER TABLE logs.changes ALTER COLUMN record_data SET STATISTICS -1;`,
  );
}
