import config from 'config';

import { addHooks } from './hooks';
import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  const store = await openDatabase(key, {
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

export async function initDatabase({ testMode = false, dbKey = 'main' }) {
  // connect to database
  return await getOrCreateConnection(
    {
      testMode,
      saltRounds: config.auth.saltRounds,
    },
    dbKey,
  );
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
  return closeAllDatabases();
}
