import config from 'config';

import { log } from 'shared/services/logging';

import { SqlWrapper } from './wrapper/sqlWrapper';

let existingConnection = null;

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const store = await new SqlWrapper({
    ...config.db,
    testMode,
    log,
    makeEveryModelParanoid: true,
    saltRounds: config.auth.saltRounds,
  }).init();

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop();
    await store.sequelize.sync({ force: true });
  } else if (config.db.syncOnStartup) {
    await store.sequelize.migrate();
  } else {
    log.warn("Not doing any migrations");
  }

  existingConnection = { store };
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    const { store } = existingConnection;
    existingConnection = null;
    await store.close();
  }
}
