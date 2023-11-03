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
    makeEveryModelParanoid: true,
  });
  return existingConnections[key];
};

export async function initDatabase() {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection({
    primaryKeyDefault: testMode ? fakeUUID : undefined,
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

export async function initReporting() {
  const { connections } = config.db.reportSchemas;
  return Object.entries(connections).reduce(async (acc, [schemaName, { username, password }]) => {
    const instance = await initReportStore(schemaName, {
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
