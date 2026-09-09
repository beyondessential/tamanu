import __cjs_case from 'case';
const { snake } = __cjs_case;
import { mapValues } from 'es-toolkit';
import { Sequelize } from 'sequelize';

const SCHEMA = 'sync_snapshots';

const assertIfSessionIdIsSafe = (sessionId: string) => {
  const safeIdRegex = /^[A-Za-z0-9-]+$/;
  if (!safeIdRegex.test(sessionId)) {
    throw new Error(
      `${sessionId} does not match the expected format of a session id - be careful of SQL injection!`,
    );
  }
};

// includes a safety check for using in raw sql rather than via sequelize query building
export const getSnapshotTableName = (sessionId: string) => {
  assertIfSessionIdIsSafe(sessionId);

  return `"${SCHEMA}"."${sessionId}"`;
};

export const getMarkedForSyncPatientsTableName = (sessionId: string, isFullSync: boolean) => {
  assertIfSessionIdIsSafe(sessionId);

  return `"${SCHEMA}"."${sessionId}_${
    isFullSync ? 'full_sync' : 'regular_sync'
  }_marked_for_sync_patients"`;
};

export const createSnapshotTable = async (sequelize: Sequelize, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  const indexNamePrefix = tableName
    .replaceAll('.', '_')
    .replaceAll('"', '')
    .replaceAll('-', '');     
  await sequelize.query(`
    CREATE TABLE ${tableName} (
      id BIGSERIAL PRIMARY KEY,
      direction text NOT NULL,
      record_type text NOT NULL,
      record_id text NOT NULL,
      is_deleted boolean NOT NULL,
      data json NOT NULL,
      saved_at_sync_tick bigint, -- saved_at_sync_tick is used to check whether record has been updated between incoming and outgoing phase of a single session
      updated_at_by_field_sum bigint, -- updated_at_by_field_sum is used to check whether record has had changes to field during merge and save component of push phase
      sync_lookup_id bigint,
      changelog_records json,
      requires_repull boolean DEFAULT false
    ) WITH (
      autovacuum_enabled = off
    );
    CREATE INDEX ${indexNamePrefix}_dir_id_idx ON ${tableName}(direction, id) INCLUDE (record_type);
    CREATE INDEX ${indexNamePrefix}_dir_rec_id_idx ON ${tableName}(direction, record_type, id);
  `);
};

export const dropSnapshotTable = async (sequelize: Sequelize, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  await sequelize.query(`
    DROP TABLE IF EXISTS ${tableName};
  `);
};

export const dropMarkedForSyncPatientsTable = async (sequelize: Sequelize, sessionId: string) => {
  const fullSyncMarkedForSyncPatientsTableName = getMarkedForSyncPatientsTableName(sessionId, true);
  const regularSyncMarkedForSyncPatientsTableName = getMarkedForSyncPatientsTableName(
    sessionId,
    false,
  );
  await sequelize.query(`
    DROP TABLE IF EXISTS ${fullSyncMarkedForSyncPatientsTableName};
    DROP TABLE IF EXISTS ${regularSyncMarkedForSyncPatientsTableName};
  `);
};

export const dropAllSnapshotTables = async (sequelize: Sequelize) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropSchema(SCHEMA);
  await queryInterface.createSchema(SCHEMA, {});
};

const snakeKey = (obj: object) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [snake(key), value]));

function isJsonAttribute(attr: string): attr is 'data' | 'changelog_records' {
  return attr === 'data' || attr === 'changelog_records';
}

/**
 * The `snapshot` table is written to without a Sequelize model, so nothing knows these columns are
 * JSON. node-postgres serialises a JavaScript array (`[1, 2, 3]`) to a PostgreSQL array literal
 * (`{1, 2, 3}`), which JSON rejects. Serialise them here instead.
 */
function stringifyJsonAttributes(record: Record<string, unknown>) {
  return mapValues(record, (value, key) =>
    isJsonAttribute(key) && value != null ? JSON.stringify(value) : value,
  );
}

export const insertSnapshotRecords = async (
  sequelize: Sequelize,
  sessionId: string,
  records: object[],
) => {
  const queryInterface = sequelize.getQueryInterface();
  const sanitizedRecords = records.map(r => stringifyJsonAttributes(snakeKey(r)));
  await queryInterface.bulkInsert({ tableName: sessionId, schema: SCHEMA }, sanitizedRecords);
};

export const updateSnapshotRecords = async (
  sequelize: Sequelize,
  sessionId: string,
  values: object,
  where: object,
) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkUpdate(
    { tableName: sessionId, schema: SCHEMA },
    stringifyJsonAttributes(snakeKey(values)),
    snakeKey(where),
  );
};

export const vacuumAnalyzeSnapshotTable = async (sequelize: Sequelize, sessionId: string) => {
  const tableName = getSnapshotTableName(sessionId);
  // VACUUM cannot run inside an open transaction; caller must ensure autocommit context
  await sequelize.query(`VACUUM (ANALYZE) ${tableName};`);
};
