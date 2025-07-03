import { dropSnapshotTable } from './manageSnapshotTable';
import { Database } from '~/infra/db';

export const clearPersistedSyncSessionRecords = async (sessionId?: string): Promise<void> => {
  const queryRunner = Database.client.createQueryRunner();
  if (sessionId) {
    await dropSnapshotTable(queryRunner, sessionId);
  } else {
    const tables = await queryRunner.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'sync_snapshots_%'
    `);
    
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table.name}`);
    }
  }
};
