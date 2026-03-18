import config from 'config';
import { closeAllDatabases, openDatabase } from '../src/services/database';
import { loadSnapshotIfAvailable } from '../src/services/migrations';
import { log } from '@tamanu/shared/services/logging';
import { fakeUUID } from '@tamanu/utils/generateId';

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  return openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });
};

export async function initDatabase() {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
}

export async function createTestDatabase() {
  const database = await initDatabase();
  const { sequelize } = database;

  await loadSnapshotIfAvailable(log, sequelize);
  await sequelize.migrate('up');

  return database;
}

export async function closeDatabase() {
  return closeAllDatabases();
}
