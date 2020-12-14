import { Sequelize } from 'sequelize';
import config from 'config';
import { initDatabase as sharedInitDatabase } from 'shared/services/database';

import { v4 as uuid } from 'uuid';
import { log } from '../logging';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => `test-${uuid().slice(5)}`;

export function initDatabase({ testMode = false }) {
  // connect to database
  const { username, password, name, verbose, sqlitePath } = config.db;
  const uuidGenerator = testMode ? createTestUUID : Sequelize.UUIDV4;

  return sharedInitDatabase({ username, password, name, sqlitePath, verbose, log, uuidGenerator });
}
