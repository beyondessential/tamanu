import { QueryInterface } from 'sequelize';

// Dropping the table doesn't touch its sync_lookup rows, so clean them out;
// runs after the drop so no new rows can appear behind it.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type = 'vital_logs';
  `);
}

export async function down(): Promise<void> {
  // nothing to restore: lookup rows regenerate from source tables only
}
