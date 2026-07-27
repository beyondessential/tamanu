import { QueryInterface } from 'sequelize';

// Monitoring and support tooling filter sync_sessions by these time columns
// (e.g. bestool-tamanu-doctor sweeps); without indexes each check seq-scans
// the whole table, which on long-lived centrals is millions of rows.
// IF NOT EXISTS so deployments that already created them manually are adopted.
const INDEXES = [
  ['sync_sessions_updated_at_idx', 'updated_at'],
  ['sync_sessions_created_at_idx', 'created_at'],
  ['sync_sessions_start_time_idx', 'start_time'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [name, column] of INDEXES) {
    await query.sequelize.query(
      `CREATE INDEX IF NOT EXISTS ${name} ON sync_sessions (${column});`,
    );
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const [name] of INDEXES) {
    await query.sequelize.query(`DROP INDEX IF EXISTS ${name};`);
  }
}
