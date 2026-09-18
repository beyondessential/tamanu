import { Database } from '~/infra/db';
import { SNAPSHOT_TABLE } from '~/infra/db/snapshotDatabase';
import { chunk } from 'es-toolkit/compat';
import type { SyncRecord } from '../types';

export const insertSnapshotRecords = async (
  records: Record<string, any>[],
  maxRecordsPerBatch: number,
) => {
  for (const batch of chunk(records, maxRecordsPerBatch)) {
    await Database.client.query(`INSERT INTO ${SNAPSHOT_TABLE} (data) VALUES (?)`, [
      JSON.stringify(batch),
    ]);
  }
};

export const getSnapshotBatchIds = async (): Promise<number[]> => {
  const result = await Database.client.query(`SELECT id FROM ${SNAPSHOT_TABLE} ORDER BY id`);
  return result.map(row => row.id);
};

export const getSnapshotBatchesByIds = async (batchIds: number[]): Promise<SyncRecord[]> => {
  if (batchIds.length === 0) {
    return [];
  }
  const placeholders = batchIds.map(() => '?').join(',');
  const rows = await Database.client.query(
    `SELECT data FROM ${SNAPSHOT_TABLE} WHERE id IN (${placeholders})`,
    batchIds,
  );
  return rows.flatMap(row => JSON.parse(row.data));
};

export const createSnapshotTable = async () => {
  try {
    await Database.client.query(`
      CREATE TABLE ${SNAPSHOT_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('Error creating snapshot table', error);
    throw error;
  }
};

/**
 * The snapshot file has `auto_vacuum = FULL`, so dropping the table truncates the file back to
 * (almost) nothing rather than leaving free pages behind.
 */
export const dropSnapshotTable = async () => {
  try {
    await Database.client.query(`DROP TABLE IF EXISTS ${SNAPSHOT_TABLE}`);
  } catch (error) {
    // The snapshot file runs without a journal, so being killed mid-write can leave it unreadable.
    // Nothing in it is worth keeping: start again from a fresh file.
    console.warn('Error dropping snapshot table, recreating the snapshot database', error);
    await Database.resetSnapshotDatabase();
  }
};
