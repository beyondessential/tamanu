import config from 'config';

import { initDatabase as sharedInitDatabase } from '@tamanu/shared/services/database';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { addHooks } from './hooks';

let existingConnections = {};

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  if (existingConnections[key]) {
    return existingConnections[key];
  }
  const store = await sharedInitDatabase({
    ...config.db,
    ...configOverrides,
    testMode,
  });
  if (existingConnections[key]) {
    throw new Error('race condition! getOrCreateConnection called for the same key in parallel');
  }

  existingConnections[key] = store;

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop({ cascade: true });
    await store.sequelize.migrate('up');
  }
  if (key === 'main') {
    await addHooks(store);
  }

  return existingConnections[key];
};

export async function initDatabase({ testMode = false }) {
  // connect to database
  return getOrCreateConnection({
    testMode,
    saltRounds: config.auth.saltRounds,
  });
}

async function initReportStore(schemaName, credentials) {
  const { username, password, pool } = credentials;
  const overrides = {
    alwaysCreateConnection: false,
    migrateOnStartup: false,
    pool,
    username,
    password,
  };
  if (!Object.values(REPORT_DB_SCHEMAS).includes(schemaName)) {
    log.warn(`Unknown reporting schema ${schemaName}, skipping...`);
    return null;
  }
  if (!username || !password) {
    log.warn(`No credentials provided for ${schemaName} reporting schema, skipping...`);
    return null;
  }
  return getOrCreateConnection(overrides, `reporting-${schemaName}`);
}

export async function initReporting() {
  const { connections } = config.db.reportSchemas;
  return Object.entries(connections).reduce(
    async (accPromise, [schemaName, { username, password }]) => {
      const instance = await initReportStore(schemaName, {
        username,
        password,
      });
      if (!instance) return accPromise;
      return { ...(await accPromise), [schemaName]: instance };
    },
    Promise.resolve({}),
  );
}

export async function closeDatabase() {
  // this looks less idiomatic than a for..of, but it avoids race conditions
  // where new connections are added while we're closing existing ones
  while (Object.keys(existingConnections).length) {
    const key = Object.keys(existingConnections)[0];
    const connection = existingConnections[key];
    delete existingConnections[key];
    await connection.sequelize.close();
  }
}
