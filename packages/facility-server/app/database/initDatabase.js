import config from 'config';

import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { fakeUUID } from '@tamanu/utils/generateId';

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  return await openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });
};

export async function initDatabase(configOverrides = {}) {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    configOverrides,
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
}

export async function closeDatabase() {
  return closeAllDatabases();
}
