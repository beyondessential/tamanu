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

// Concurrently-starting processes race on this cluster-global grant
// ("tuple concurrently updated"). Serialise with a transaction-scoped
// advisory lock; the grant is idempotent so re-applying it once per
// process startup is harmless. Same lock key as main's reporting roles.
const REPORTING_GRANTS_LOCK_KEY = '7829301042';

// The grant can also race autovacuum's in-place pg_class updates ("tuple
// concurrently updated", XX000) — the advisory lock only serialises our own
// processes, not background workers. Fixed upstream in the 2024-11 postgres
// minors (12.21+), but deployments run older; the grant is idempotent, so
// retry with backoff.
const GRANT_ATTEMPTS = 3;

const grantPrivileges = async (existingStore, schemaName, username) => {
  for (let attempt = 1; ; attempt++) {
    try {
      await existingStore.sequelize.transaction(async () => {
        await existingStore.sequelize.query(
          `SELECT pg_advisory_xact_lock(${REPORTING_GRANTS_LOCK_KEY}::bigint);`,
        );
        await existingStore.sequelize.query(`
          GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaName} TO ${username};
        `);
      });
      return;
    } catch (error) {
      const code = error?.original?.code ?? error?.parent?.code;
      if (code !== 'XX000' || attempt >= GRANT_ATTEMPTS) throw error;
      log.warn(`grantPrivileges(${username}): retrying after catalog update race`, { attempt });
      await new Promise(resolve => {
        setTimeout(resolve, 500 * attempt);
      });
    }
  }
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
