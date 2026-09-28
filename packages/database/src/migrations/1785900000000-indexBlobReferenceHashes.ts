import { QueryInterface } from 'sequelize';

const REFERENCE_TABLES = ['attachments', 'assets'] as const;

// spec: BKFL, RECL
// No mobile migration: mobile has no `assets` table and these scans run server-side.
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
