import config from 'config';
import pg from 'pg';

import { SqlWrapper } from './sqlWrapper';
import { log } from '../logging';

let existingConnection = null;

// this is dangerous and should only be used in test mode
const recreateDb = async name => {
  const { username, password } = config.db;
  const client = new pg.Client({
    user: username,
    password,
  });
  try {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS "${name}"`);
    await client.query(`CREATE DATABASE "${name}"`);
  } catch (e) {
    log.error(e.message);
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
    await recreateDb(name);
  }

  const store = await new SqlWrapper({
    ...config.db,
    name,
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
