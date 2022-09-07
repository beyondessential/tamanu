import config from 'config';
import { v4 as uuid } from 'uuid';

import { initDatabase as sharedInitDatabase } from 'shared/services/database';

// make a 'fake' uuid that looks like 'abcd7766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'abcd%'"
const createTestUUID = () => `abcd${uuid().slice(4)}`;

let existingConnection = null;

export async function initDatabase() {
  if (existingConnection) {
    return existingConnection;
  }

  const testMode = process.env.NODE_ENV === 'test';
  existingConnection = await sharedInitDatabase({
    ...config.db,
    testMode,
    primaryKeyDefault: testMode ? createTestUUID : undefined,
    syncClientMode: true,
  });
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    const oldConnection = existingConnection;
    existingConnection = null;
    await oldConnection.sequelize.close();
  }
}
