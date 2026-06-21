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
// to manage and every replica derives the same value. Rotating db.password changes
// the derived password (re-applied on the next startup), so a rotation needs a
// coordinated restart of all servers or their live reporting connections will fail.
const reportingRolePassword = role =>
  crypto
    .createHmac('sha256', config.db.password ?? '')
    .update(`tamanu-report-role:${role}`)
    .digest('hex');

const ensureReportingRole = async (existingStore, connectionName, password) => {
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];
  const { sequelize } = existingStore;

  // The central app types (api, fhir workers, tasks) all init concurrently and
  // would race on these cluster-global role objects ("tuple concurrently
  // updated"). Serialise with a transaction-scoped advisory lock; the DDL is
  // idempotent so re-applying it once per startup is harmless.
  await sequelize.transaction(async () => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(hashtext('tamanu:reporting-roles'));`);

    await sequelize.query(`
      DO $$
      BEGIN
        CREATE ROLE "${role}" LOGIN;
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Reporting role "${role}" already exists, skipping creation';
      END
      $$;
    `);

    // Escape as a literal (DDL can't bind it) and don't log it — it's a credential.
    await sequelize.query(
      `ALTER ROLE "${role}" WITH LOGIN PASSWORD ${sequelize.escape(password)};`,
      { logging: false },
    );

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
  });
};

const initReportStore = async (existingStore, connectionName) => {
  const testMode = process.env.NODE_ENV === 'test';
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const password = reportingRolePassword(role);
  await ensureReportingRole(existingStore, connectionName, password);

  const overrides = {
    ...config.db,
    alwaysCreateConnection: false,
    migrateOnStartup: false,
    disableChangesAudit: true,
    username: role,
    password,
    testMode,
  };

  return openDatabase(`reporting-${connectionName}`, overrides);
};

export const initReporting = async existingStore => {
  if (!config.db.password) {
    // Fine under trust auth (the password isn't checked). Under password auth it means
    // the reporting role's password derives from an empty key — inferable from source
    // and identical across installs — so it must be set.
    log.warn(
      'db.password is empty: reporting role passwords derive from an empty key, so they are ' +
        'not unique to this instance and are inferable from source. Set db.password unless using trust auth.',
    );
  }
  // Sequential: concurrent role/schema DDL on the same db can deadlock.
  const stores = {};
  for (const connectionName of REPORT_DB_CONNECTION_VALUES) {
    stores[connectionName] = await initReportStore(existingStore, connectionName);
  }
  return stores;
};
