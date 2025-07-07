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

export const getSnapshotBatchCount = async (): Promise<number> => {
  const result = await Database.client.query(`SELECT COUNT(*) FROM sync_snapshot`);
  return result[0].count;
};

export const getSnapshotBatches = async (
  limit: number,
  offset: number,
): Promise<Record<string, any>[]> => {
  const rows = await Database.client.query(
    `SELECT id, data FROM sync_snapshot LIMIT ${limit} OFFSET ${offset}`,
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
