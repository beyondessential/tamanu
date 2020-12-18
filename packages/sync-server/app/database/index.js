import config from 'config';

// import { MongoWrapper } from './mongoWrapper';
import { PostgresWrapper } from './postgresWrapper';
import { log } from '../logging';
import { getUUIDGenerator } from './uuid';

let existingConnection = null;

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const { username, name } = config.db;
  log.info(`Connecting to postgres database ${username}@${name}`);
  const store = await new PostgresWrapper({
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
