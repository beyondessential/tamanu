import crypto from 'crypto';
import config from 'config';

import {
  REPORT_DB_CONNECTION_ROLES,
  REPORT_DB_CONNECTION_SCHEMAS,
  REPORT_DB_CONNECTION_VALUES,
  FACT_REPORTING_ROLE_SECRET,
} from '@tamanu/constants';
import { openDatabase } from './database';

// Tamanu owns the reporting/raw roles: unprivileged read-only LOGIN roles it
// provisions and connects AS. We log in as the role rather than SET ROLE from the
// core user, which report SQL could reverse (RESET ROLE / COMMIT) to write as core.
// Their passwords derive from a random per-server secret (below) so they're real
// secrets regardless of the core db auth method (trust, peer or password).
const reportingRolePassword = (secret, role) =>
  crypto
    .createHmac('sha256', secret)
    .update(`tamanu-report-role:${role}`)
    .digest('hex');

// Random per-server secret, generated once and stored in local_system_facts
// (not synced — like the device key). setIfAbsent is INSERT ... ON CONFLICT DO
// NOTHING, so the concurrent startup contexts don't clobber each other.
const getReportingSecret = async ({ models }) => {
  let secret = await models.LocalSystemFact.get(FACT_REPORTING_ROLE_SECRET);
  if (!secret) {
    await models.LocalSystemFact.setIfAbsent(
      FACT_REPORTING_ROLE_SECRET,
      crypto.randomBytes(32).toString('hex'),
    );
    secret = await models.LocalSystemFact.get(FACT_REPORTING_ROLE_SECRET);
  }
  return secret;
};

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

const initReportStore = async (existingStore, connectionName, secret) => {
  const testMode = process.env.NODE_ENV === 'test';
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const password = reportingRolePassword(secret, role);
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
  const secret = await getReportingSecret(existingStore);
  // Sequential: concurrent role/schema DDL on the same db can deadlock.
  const stores = {};
  for (const connectionName of REPORT_DB_CONNECTION_VALUES) {
    stores[connectionName] = await initReportStore(existingStore, connectionName, secret);
  }
  return stores;
};
