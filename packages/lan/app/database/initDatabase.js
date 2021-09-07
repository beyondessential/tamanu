import config from 'config';
import { v4 as uuid } from 'uuid';

import { initDatabase as sharedInitDatabase } from 'shared/services/database';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => `test-${uuid().slice(5)}`;

export async function initDatabase() {
  const testMode = process.env.NODE_ENV === 'test';
  return sharedInitDatabase({
    ...config.db,
    testMode,
    primaryKeyDefault: testMode ? createTestUUID : undefined,
    syncClientMode: true,
  });
}
