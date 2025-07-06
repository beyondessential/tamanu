import { Database } from '../../../infra/db';
import { chunk } from 'lodash';

export const assertIfSessionIdIsSafe = (sessionId: string) => {
  const safeIdRegex = /^[A-Za-z0-9-]+$/;
  if (!safeIdRegex.test(sessionId)) {
    throw new Error(
      `${sessionId} does not match the expected format of a session id - be careful of SQL injection!`,
    );
  }
};

export const getSnapshotTableName = (sessionId: string) => {
  assertIfSessionIdIsSafe(sessionId);

  // SQLite doesn't support schemas, so we namespace the table name
  return `sync_snapshots_${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}`;
};

export const insertSnapshotRecords = async (sessionId: string, records: Record<string, any>[]) => {
  const tableName = getSnapshotTableName(sessionId);
  const TEMPORARY_MAX_BATCH_SIZE = 1000; // TODO: with streaming Will be based on bytes
  for (const batch of chunk(records, TEMPORARY_MAX_BATCH_SIZE)) {
    await Database.client.query(`INSERT INTO ${tableName} (data) VALUES (?)`, [
      JSON.stringify(batch),
    ]);
  }
};

export const getSnapshotBatchIds = async (sessionId: string): Promise<number[]> => {
  const tableName = getSnapshotTableName(sessionId);
  const result = await Database.client.query(`SELECT id FROM ${tableName} ORDER BY id`);
  return result.map(row => row.id);
};

export const getSnapshotBatchById = async (
  sessionId: string,
  batchId: number,
): Promise<Record<string, any>[]> => {
  const tableName = getSnapshotTableName(sessionId);
  const rows = await Database.client.query(`SELECT data FROM ${tableName} WHERE id = ?`, [batchId]);

  if (rows.length === 0) {
    return [];
  }

  return JSON.parse(rows[0].data);
};

export const createSnapshotTable = async (sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);

  // Just save the batches straight from the stream
  // No outgoing changes snapshotting on push
  try {
    await Database.client.query(`
      CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error(`Error creating snapshot table ${tableName}:`, error);
    throw error;
  }
};

export const dropSnapshotTable = async (sessionId?: string) => {
  if (!sessionId) {
    const tables = await Database.client.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sync_snapshots_%'",
    );
    for (const table of tables) {
      await Database.client.query(`DROP TABLE IF EXISTS ${table.name}`);
    }
  } else {
    const tableName = getSnapshotTableName(sessionId);
    await Database.client.query(`
      DROP TABLE IF EXISTS ${tableName};
    `);
  }
};
