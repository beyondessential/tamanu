import config from 'config';

import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { fakeUUID } from '@tamanu/utils/generateId';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_DB_CONNECTIONS } from '@tamanu/constants';

 const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  return await openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });
};

export async function initDatabase(configOverrides = {}) {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    configOverrides,
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
}

async function initReportStore(schemaName, credentials) {
  const { username, password, pool } = credentials;
  const overrides = {
    alwaysCreateConnection: false,
    migrateOnStartup: false,
    disableChangesAudit: true,
    pool,
    username,
    password,
  };
  if (!Object.values(REPORT_DB_CONNECTIONS).includes(schemaName)) {
    log.warn(`Unknown reporting schema ${schemaName}, skipping...`);
    return null;
  }

  if (!username || !password) {
    log.warn(`No credentials provided for ${schemaName} reporting schema, skipping...`);
    return null;
  }
  try {
    const connection = getOrCreateConnection(overrides, `reporting-${schemaName}`);
    return connection;
  } catch (e) {
    log.warn(
      `It was not possible to establish a connection with the report schema ${schemaName}. Please check the credentials on config file`,
    );
    return null;
  }
}

export async function initReporting(existingStore) {
  const { connections } = config.db.reportSchemas;
  return Object.entries(connections).reduce(async (acc, [schemaName, { username, password }]) => {
    const instance = await initReportStore(existingStore, schemaName, {
      username,
      password,
    });
    if (!instance) return acc;
    return { ...(await acc), [schemaName]: instance };
  }, {});
}

export async function closeDatabase() {
  return closeAllDatabases();
}
