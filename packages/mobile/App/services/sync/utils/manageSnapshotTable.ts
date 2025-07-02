import { QueryRunner } from 'typeorm';
import { chunk } from 'lodash';

const assertIfSessionIdIsSafe = (sessionId: string) => {
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

export const insertSnapshotRecords = async (
  queryRunner: QueryRunner,
  sessionId: string,
  records: Record<string, any>[],
) => {
  const tableName = getSnapshotTableName(sessionId);
  for (const batch of chunk(records, 5000)) {
    await queryRunner.query(
      `INSERT INTO ${tableName} (data) VALUES (?)`,
      [JSON.stringify(batch)]
    );
  }
};

export const getSnapshotBatchIds = async (
  queryRunner: QueryRunner,
  sessionId: string,
): Promise<number[]> => {
  const tableName = getSnapshotTableName(sessionId);
  const result = await queryRunner.query(`SELECT id FROM ${tableName} ORDER BY id`);
  return result.map(row => row.id);
};

export const getSnapshotBatchById = async (
  queryRunner: QueryRunner,
  sessionId: string,
  batchId: number,
): Promise<Record<string, any>[]> => {
  const tableName = getSnapshotTableName(sessionId);
  const rows = await queryRunner.query(
    `SELECT data FROM ${tableName} WHERE id = ?`,
    [batchId]
  );
  
  if (rows.length === 0) {
    return [];
  }
  
  return JSON.parse(rows[0].data);
};

export const createSnapshotTable = async (queryRunner: QueryRunner, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);

  // Just save the batches straight from the stream
  // No outgoing changes snapshotting on push
  try {
  await queryRunner.query(`
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

export const dropSnapshotTable = async (queryRunner: QueryRunner, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  await queryRunner.query(`
    DROP TABLE IF EXISTS ${tableName};
  `);
};
