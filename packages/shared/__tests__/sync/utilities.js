import config from 'config';
import { closeAllDatabases, openDatabase } from '../../dist/cjs/services/database';
import { fakeUUID } from '../../dist/cjs/utils/generateId';

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  return openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });
};

async function initDatabase() {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
}

export async function createTestDatabase() {
  const database = await initDatabase();
  const { sequelize } = database;

  await sequelize.migrate('up');

  return database;
}

export async function closeDatabase() {
  return closeAllDatabases();
}
