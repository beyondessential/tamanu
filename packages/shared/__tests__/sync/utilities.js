import config from 'config';
import { fakeUUID } from '../../dist/cjs/utils/generateId';
import {
  closeAllDatabasesInCollection,
  initDatabaseInCollection,
} from '../../dist/cjs/services/database';

let existingConnections = {};

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  return initDatabaseInCollection(existingConnections, key, {
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
  return closeAllDatabasesInCollection(existingConnections);
}
