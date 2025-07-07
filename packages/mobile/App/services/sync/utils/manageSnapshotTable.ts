import { Database } from '../../../infra/db';
import { chunk } from 'lodash';

export const insertSnapshotRecords = async (records: Record<string, any>[]) => {
  const TEMPORARY_MAX_BATCH_SIZE = 1000; // TODO: with streaming Will be based on bytes
  for (const batch of chunk(records, TEMPORARY_MAX_BATCH_SIZE)) {
    await Database.client.query(`INSERT INTO sync_snapshot (data) VALUES (?)`, [
      JSON.stringify(batch),
    ]);
  }
};

export const getSnapshotBatchIds = async (): Promise<number[]> => {
  const result = await Database.client.query(`SELECT id FROM sync_snapshot ORDER BY id`);
  return result.map(row => row.id);
};

export const getSnapshotBatchesByIds = async (
  batchIds: number[],
): Promise<Record<string, any>[]> => {
  const rows = await Database.client.query(
    `SELECT data FROM sync_snapshot WHERE id IN (${batchIds.map(id => `'${id}'`).join(',')})`,
  );
  return rows.flatMap(row => JSON.parse(row.data));
};

export const createSnapshotTable = async () => {
  try {
    await Database.client.query(`
      CREATE TABLE sync_snapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('Error creating snapshot table', error);
    throw error;
  }
};

export const dropSnapshotTable = async () => {
  await Database.client.query(`DROP TABLE IF EXISTS sync_snapshot`);
};
