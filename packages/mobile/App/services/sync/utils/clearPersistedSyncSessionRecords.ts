import { Connection } from 'typeorm';
import { dropSnapshotTable } from './manageSnapshotTable';

export const clearPersistedSyncSessionRecords = async (client: Connection, sessionId?: string): Promise<void> => {
  if (sessionId) {
    await dropSnapshotTable(client, sessionId);
  } else {
    const tables = await client.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'sync_snapshots_%'
    `);
    
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table.name}`);
    }
  }
};
