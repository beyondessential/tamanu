import config from 'config';

import { SqlWrapper } from './wrapper/sqlWrapper';
import { addHooks } from './hooks';

let existingConnection = null;

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const store = await new SqlWrapper({
    ...config.db,
    testMode,
    makeEveryModelParanoid: true,
    saltRounds: config.auth.saltRounds,
  }).init();

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop();
    await store.sequelize.sync();
  }

  await addHooks(store);

  existingConnection = store;
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    const store = existingConnection;
    existingConnection = null;
    await store.close();
  }
}
