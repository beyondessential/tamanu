import { QueryRunner } from 'typeorm';

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
  return `sync_snapshots_${sessionId}`;
};

export const createSnapshotTable = async (queryRunner: QueryRunner, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  
  await queryRunner.query(`
    CREATE TABLE ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recordType VARCHAR(255) NOT NULL,
      recordId VARCHAR(255) NOT NULL,
      isDeleted INTEGER NOT NULL,
      data TEXT NOT NULL,
    );
  `);
  
  await queryRunner.query(`
    CREATE INDEX ${tableName}_direction_index ON ${tableName}(direction);
  `);
};

export const dropSnapshotTable = async (queryRunner: QueryRunner, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  await queryRunner.query(`
    DROP TABLE IF EXISTS ${tableName};
  `);
};
