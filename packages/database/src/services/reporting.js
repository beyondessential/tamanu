import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { REPORT_DB_CONNECTIONS, REPORT_DB_CONNECTION_SCHEMAS } from '@tamanu/constants';
import { openDatabase } from './database';

const validateUser = async (existingStore, username) => {
  const [result] = await existingStore.sequelize.query(
    `
      SELECT 1 FROM pg_roles WHERE rolname = :username
    `,
    {
      replacements: { username },
    },
  );

  if (result.length === 0) {
    throw new Error(
      `Reporting role "${username}" does not exist, please create the role in the database first`,
    );
  }
};

const grantPrivileges = async (existingStore, schemaName, username) => {
  await existingStore.sequelize.query(`
      GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaName} TO ${username};
    `);
};

const initReportStore = async (existingStore, connectionName, credentials) => {
  const testMode = process.env.NODE_ENV === 'test';
  const { username, password, pool } = credentials;
  const overrides = {
    ...config.db,
    alwaysCreateConnection: false,
    migrateOnStartup: false,
    pool,
    username,
    password,
    testMode,
  };
  if (!Object.values(REPORT_DB_CONNECTIONS).includes(connectionName)) {
    log.warn(`Unknown reporting connection ${connectionName}, skipping...`);
    return null;
  }
  if (!username || !password) {
    log.warn(`No credentials provided for ${connectionName} reporting schema, skipping...`);
    return null;
  }

  await validateUser(existingStore, username);
  await grantPrivileges(existingStore, REPORT_DB_CONNECTION_SCHEMAS[connectionName], username);

  return openDatabase(`reporting-${connectionName}`, overrides);
};

export const initReporting = async existingStore => {
  const { connections } = config.db.reportSchemas;
  return Object.entries(connections).reduce(
    async (accPromise, [schemaName, { username, password }]) => {
      const instance = await initReportStore(existingStore, schemaName, {
        username,
        password,
      });
      if (!instance) return accPromise;
      return { ...(await accPromise), [schemaName]: instance };
    },
    Promise.resolve({}),
  );
};
