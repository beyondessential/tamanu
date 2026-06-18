import crypto from 'crypto';
import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import {
  REPORT_DB_CONNECTION_ROLES,
  REPORT_DB_CONNECTION_SCHEMAS,
  REPORT_DB_CONNECTION_VALUES,
} from '@tamanu/constants';
import { openDatabase } from './database';

// Tamanu owns the reporting/raw roles: unprivileged read-only LOGIN roles it
// provisions and connects AS. We log in as the role rather than SET ROLE from the
// core user, which report SQL could reverse (RESET ROLE / COMMIT) to write as core.
// The password is derived from the core db password so there's no separate secret
// to manage and every replica derives the same value.
const reportingRolePassword = role =>
  crypto
    .createHmac('sha256', config.db.password ?? '')
    .update(`tamanu-report-role:${role}`)
    .digest('hex');

const ensureReportingRole = async (existingStore, connectionName, password) => {
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];
  const { sequelize } = existingStore;

  await sequelize.query(`
    DO $$
    BEGIN
      CREATE ROLE "${role}" LOGIN;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Reporting role "${role}" already exists, skipping creation';
    END
    $$;
  `);

  // Postgres DDL can't bind the password, so escape it as a literal.
  await sequelize.query(`ALTER ROLE "${role}" WITH LOGIN PASSWORD ${sequelize.escape(password)};`);

  if (schema !== 'public') {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    // Lets reporting reports reference tables without the schema prefix.
    await sequelize.query(`ALTER ROLE "${role}" SET search_path TO "${schema}";`);
  }

  await sequelize.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}";`);
  await sequelize.query(`GRANT SELECT ON ALL TABLES IN SCHEMA "${schema}" TO "${role}";`);
  // Covers tables created later (e.g. materialised reporting tables).
  await sequelize.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT SELECT ON TABLES TO "${role}";`,
  );
};

const initReportStore = async (existingStore, connectionName, { pool } = {}) => {
  const testMode = process.env.NODE_ENV === 'test';
  if (!REPORT_DB_CONNECTION_VALUES.includes(connectionName)) {
    log.warn(`Unknown reporting connection ${connectionName}, skipping...`);
    return null;
  }

  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const password = reportingRolePassword(role);
  await ensureReportingRole(existingStore, connectionName, password);

  const overrides = {
    ...config.db,
    alwaysCreateConnection: false,
    migrateOnStartup: false,
    disableChangesAudit: true,
    ...(pool ? { pool } : {}), // avoid clobbering config.db.pool with undefined
    username: role,
    password,
    testMode,
  };

  return openDatabase(`reporting-${connectionName}`, overrides);
};

export const initReporting = async existingStore => {
  if (!config.db.password) {
    // Expected under trust auth; in a password-authenticated deployment it means the
    // derived reporting passwords aren't tied to this instance (likely misconfig).
    log.warn(
      'db.password is empty: reporting role passwords are derived from an empty key and are not unique to this instance.',
    );
  }
  const { connections } = config.db.reportSchemas;
  // Sequential: concurrent role/schema DDL on the same db can deadlock.
  const stores = {};
  for (const [connectionName, { pool } = {}] of Object.entries(connections)) {
    const instance = await initReportStore(existingStore, connectionName, { pool });
    if (instance) stores[connectionName] = instance;
  }
  return stores;
};
