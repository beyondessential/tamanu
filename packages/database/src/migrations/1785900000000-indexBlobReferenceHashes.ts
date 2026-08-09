import { QueryInterface } from 'sequelize';

const REFERENCE_TABLES = ['attachments', 'assets'] as const;

// spec: BKFL, RECL
// Backfill completion checks and reclamation liveness scans both look up
// reference rows by hash.
//
// No matching mobile (TypeORM) migration: mobile has no `assets` table, and
// these scans only run server-side. Mobile's own move to hash-carrying blobs
// is card L2.
export async function up(query: QueryInterface): Promise<void> {
  for (const tableName of REFERENCE_TABLES) {
    await query.addIndex(tableName, ['hash'], {
      name: `${tableName}_hash`,
    });
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const tableName of REFERENCE_TABLES) {
    await query.removeIndex(tableName, `${tableName}_hash`);
  }
}
