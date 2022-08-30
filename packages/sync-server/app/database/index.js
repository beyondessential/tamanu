import config from 'config';

import { initDatabase as sharedInitDatabase } from 'shared/services/database';
import { addHooks } from './hooks';

let existingConnection = null;

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const store = await sharedInitDatabase({
    ...config.db,
    testMode,
    makeEveryModelParanoid: true,
    saltRounds: config.auth.saltRounds,
  });

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop({});
    // sequelize sync doesn't interpret and create custom types
    await store.sequelize.query(`CREATE DOMAIN date_time_string as CHAR(19)`);
    await store.sequelize.query(`CREATE DOMAIN date_string as CHAR(10)`);
    await store.sequelize.sync({});
  }

  await addHooks(store);

  existingConnection = store;
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    const store = existingConnection;
    existingConnection = null;
    await store.sequelize.close();
  }
}
