import config from 'config';

import { SqlWrapper } from './sqlWrapper';
import { log } from '../logging';

let existingConnection = null;

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const store = await new SqlWrapper({
    ...config.db,
    log,
    makeEveryModelParanoid: true,
    saltRounds: config.auth.saltRounds,
  }).init();

  if (testMode) {
    await store.sequelize.drop();
    await store.sequelize.sync({ force: true });
  }

  existingConnection = { store };
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    await existingConnection.store.close();
    existingConnection = null;
  }
}
