import config from 'config';

import { closeAllDatabasesInCollection, initDatabaseInCollection } from '@tamanu/shared/services/database';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { addHooks } from './hooks';

let existingConnections = {};

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  const store = await initDatabaseInCollection(existingConnections, key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop({ cascade: true });
    await store.sequelize.migrate('up');
  }
  if (key === 'main') {
    await addHooks(store);
  }

  return store;
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
  return closeAllDatabasesInCollection(existingConnections);
}
