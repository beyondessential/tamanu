import config from 'config';
import pg from 'pg';
import { Sequelize } from 'sequelize';

import { SqlWrapper } from './wrapper/sqlWrapper';
import { log } from '../logging';

let existingConnection = null;

// this is dangerous and should only be used in test mode
const unsafeRecreateDb = async ({ name, username, password, host, port }) => {
  const client = new pg.Client({
    user: username,
    password,
    host,
    port,
    // 'postgres' is the default database that's automatically
    // created on new installs - we just need something to connect
    // to, and it doesn't matter what the schema is!
    database: 'postgres',
  });
  try {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS "${name}"`);
    await client.query(`CREATE DATABASE "${name}"`);
  } catch (e) {
    log.error(`unsafeRecreateDb: ${e.stack}`);
    throw e;
  } finally {
    await client.end();
  }
};

export async function initDatabase({ testMode = false }) {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  let { name } = config.db;
  const { sqlitePath } = config.db;
  if (testMode && !sqlitePath && process.env.JEST_WORKER_ID) {
    name = `${name}-${process.env.JEST_WORKER_ID}`;
    await unsafeRecreateDb({ ...config.db, name });
  }

  const store = await new SqlWrapper({
    ...config.db,
    name,
    log,
    makeEveryModelParanoid: true,
    saltRounds: config.auth.saltRounds,
    primaryKeyType: Sequelize.STRING,
  }).init();

  if (testMode) {
    await store.sequelize.drop();
    await store.sequelize.sync({ force: testMode });
  } else if (config.db.syncOnStartup) {
    await store.sequelize.sync();
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
