import { Database } from '~/infra/db';
import { chunk } from 'lodash';
import { SyncRecord } from '../types';

export const insertSnapshotRecords = async (
  records: Record<string, any>[],
  maxRecordsPerBatch: number,
) => {
  for (const batch of chunk(records, maxRecordsPerBatch)) {
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
): Promise<SyncRecord[]> => {
  if (batchIds.length === 0) {
    return [];
  }
  const placeholders = batchIds.map(() => '?').join(',');
  const rows = await Database.client.query(
    `SELECT data FROM sync_snapshot WHERE id IN (${placeholders})`,
    batchIds,
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
