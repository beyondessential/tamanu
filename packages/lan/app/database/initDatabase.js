import config from 'config';

import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';
import { initDatabase as sharedInitDatabase } from '@tamanu/shared/services/database';

import { log } from '@tamanu/shared/services/logging';

let existingConnections = {};

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  if (existingConnections[key]) {
    return existingConnections[key];
  }
  existingConnections[key] = await sharedInitDatabase({
    ...config.db,
    ...configOverrides,
    testMode,
  });
  return existingConnections[key];
};

export async function initDatabase() {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
}

async function initReportingInstance(schemaName, credentials) {
  const { username, password } = credentials;
  const { pool } = config.db.reportSchemas;
  const overrides = {
    initialConnection: false,
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
  const { credentials } = config.db.reportSchemas;
  return Object.entries(credentials).reduce(async (acc, [schemaName, { username, password }]) => {
    const instance = await initReportingInstance(schemaName, {
      username,
      password,
    });
    if (!instance) return acc;
    return { ...(await acc), [schemaName]: instance };
  }, {});
}

export async function closeDatabase() {
  await Promise.all(
    Object.keys(existingConnections).map(k => existingConnections[k].sequelize.close()),
  );
  existingConnections = {};
}
