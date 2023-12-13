import config from 'config';
import { initDatabase as sharedInitDatabase } from '../../src/services/database';
import { fakeUUID } from '../../src/utils/generateId';

let existingConnections = {};

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  if (existingConnections[key]) {
    return existingConnections[key];
  }
  existingConnections[key] = await sharedInitDatabase({
    ...config.db,
    ...configOverrides,
    testMode,
  });
  return existingConnections[key];
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
  await Promise.all(
    Object.keys(existingConnections).map(k => existingConnections[k].sequelize.close()),
  );
  existingConnections = {};
}
