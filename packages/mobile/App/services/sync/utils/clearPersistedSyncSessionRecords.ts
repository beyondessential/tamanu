import { Database } from '~/infra/db';
import { dropSnapshotTable } from './manageSnapshotTable';

export const clearPersistedSyncSessionRecords = async (sessionId?: string): Promise<void> => {
  if (sessionId) {
    await dropSnapshotTable(sessionId);
  } else {
    const tables = await Database.client.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'sync_snapshots_%'
    `);
    
    for (const table of tables) {
      await Database.client.query(`DROP TABLE IF EXISTS ${table.name}`);
    }
  }
};
