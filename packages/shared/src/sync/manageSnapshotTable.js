import { snake } from 'case';
import config from 'config';

const SCHEMA = 'sync_snapshots';

const assertIfSessionIdIsSafe = sessionId => {
  const safeIdRegex = /^[A-Za-z0-9-]+$/;
  if (!safeIdRegex.test(sessionId)) {
    throw new Error(
      `${sessionId} does not match the expected format of a session id - be careful of SQL injection!`,
    );
  }
};

// includes a safety check for using in raw sql rather than via sequelize query building
export const getSnapshotTableName = sessionId => {
  assertIfSessionIdIsSafe(sessionId);

  return `"${SCHEMA}"."${sessionId}"`;
};

export const getMarkedForSyncPatientsTableName = (sessionId, isFullSync) => {
  assertIfSessionIdIsSafe(sessionId);

  return `"${SCHEMA}"."${sessionId}_${
    isFullSync ? 'full_sync' : 'regular_sync'
  }_marked_for_sync_patients"`;
};

export const createSnapshotTable = async (sequelize, sessionId) => {
  const tableName = getSnapshotTableName(sessionId);
  const useSerial = config.sync?.useSerial;
  const useNewUUIDV4Generator = config.sync?.useNewUUIDV4Generator;

  await sequelize.query(`
    CREATE TABLE ${tableName} (
      ${
        useSerial
          ? 'id BIGSERIAL PRIMARY KEY,'
          : `id uuid DEFAULT ${
              useNewUUIDV4Generator ? 'gen_random_uuid()' : 'uuid_generate_v4()'
            } PRIMARY KEY,`
      }
      direction character varying(255) NOT NULL,
      record_type character varying(255) NOT NULL,
      record_id character varying(255) NOT NULL,
      is_deleted boolean NOT NULL,
      data json NOT NULL,
      saved_at_sync_tick bigint, -- saved_at_sync_tick is used to check whether record has been updated between incoming and outgoing phase of a single session
      updated_at_by_field_sum bigint -- updated_at_by_field_sum is used to check whether record has had changes to field during merge and save component of push phase
    ) WITH (
      autovacuum_enabled = off
    );
    CREATE INDEX ${tableName
      .replaceAll('.', '_')
      .replaceAll('"', '')
      .replaceAll('-', '')}_direction_index ON ${tableName}(direction);
  `);
};

export const dropSnapshotTable = async (sequelize, sessionId) => {
  const tableName = getSnapshotTableName(sessionId);
  await sequelize.query(`
    DROP TABLE IF EXISTS ${tableName};
  `);
};

export const dropMarkedForSyncPatientsTable = async (sequelize, sessionId) => {
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

export const dropAllSnapshotTables = async sequelize => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropSchema(SCHEMA);
  await queryInterface.createSchema(SCHEMA, {});
};

const snakeKey = obj =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [snake(key), value]));

export const insertSnapshotRecords = async (sequelize, sessionId, records) => {
  const queryInterface = sequelize.getQueryInterface();
  const sanitizedRecords = records
    .map(r => snakeKey(r))
    .map(r => ({ ...r, data: JSON.stringify(r.data) }));
  await queryInterface.bulkInsert({ tableName: sessionId, schema: SCHEMA }, sanitizedRecords);
};

export const updateSnapshotRecords = async (sequelize, sessionId, values, where) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkUpdate(
    { tableName: sessionId, schema: SCHEMA },
    snakeKey(values),
    snakeKey(where),
  );
};
