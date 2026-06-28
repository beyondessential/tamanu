import crypto from 'crypto';
import config from 'config';

import {
  REPORT_DB_CONNECTION_ROLES,
  REPORT_DB_CONNECTION_SCHEMAS,
  REPORT_DB_CONNECTION_VALUES,
  FACT_REPORTING_ROLE_SECRET,
  FACT_REPORTING_SECRET_ROTATED_AT,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { openDatabase } from './database';
import { resolveDbConfig } from './connectionConfig';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// int8 keys above the int4 range hashtext() returns, so they can't collide with other locks.
const REPORTING_ROLES_LOCK_KEY = '7829301042';
const REPORTING_SECRET_LOCK_KEY = '7829301043';

const SECRET_ROTATION_DAYS = 90;

export const isReportingSecretStale = (rotatedAt, days) => {
  if (!days || !rotatedAt) return false;
  return Date.now() - new Date(rotatedAt).getTime() >= days * MS_PER_DAY;
};

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

// The advisory lock makes concurrently-starting processes converge on one secret
// rather than each generating its own.
const getReportingSecret = async ({ models, sequelize }) =>
  sequelize.transaction(async () => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${REPORTING_SECRET_LOCK_KEY}::bigint);`);

    const existing = await models.LocalSystemSecret.get(FACT_REPORTING_ROLE_SECRET);
    let rotatedAt = await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT);
    if (existing) {
      // Pre-existing secret with no timestamp: seed it so rotation can start.
      if (!rotatedAt) {
        rotatedAt = getCurrentDateTimeString();
        await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, rotatedAt);
      }
      if (!isReportingSecretStale(rotatedAt, SECRET_ROTATION_DAYS)) return existing;
    }

    const secret = crypto.randomBytes(32).toString('hex');
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, secret);
    await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, getCurrentDateTimeString());
    return secret;
  });

const ensureReportingRole = async (existingStore, connectionName, password) => {
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];
  const { sequelize } = existingStore;

  // The central app types (api, fhir workers, tasks) all init concurrently and
  // would race on these cluster-global role objects ("tuple concurrently
  // updated"). Serialise with a transaction-scoped advisory lock; the DDL is
  // idempotent so re-applying it once per startup is harmless.
  await sequelize.transaction(async () => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${REPORTING_ROLES_LOCK_KEY}::bigint);`);

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
    // On failure, re-throw without the original error: its `sql` field holds the
    // statement with the password inline, which a generic error log would leak.
    try {
      await sequelize.query(
        `ALTER ROLE "${role}" WITH LOGIN PASSWORD ${sequelize.escape(password)};`,
        { logging: false },
      );
    } catch (error) {
      throw new Error(`Failed to set password for reporting role "${role}": ${error.message}`);
    }

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

    // The raw role reads all of `public` for reporting, but report SQL has no
    // business reading credential/token tables: local_system_secrets holds the
    // device private key and the reporting secret (encrypted, but still not for
    // reports), and the rest hold auth tokens or certificate signing keys. Revoke
    // SELECT on them.
    // to_regclass skips any not present on this server (e.g. central-only ones).
    if (schema === 'public') {
      await sequelize.query(`
        DO $$
        DECLARE
          sensitive_table text;
        BEGIN
          FOREACH sensitive_table IN ARRAY ARRAY[
            'local_system_secrets',
            'one_time_logins',
            'portal_one_time_tokens',
            'refresh_tokens',
            'signers',
            'signers_historical'
          ] LOOP
            IF to_regclass('public.' || sensitive_table) IS NOT NULL THEN
              EXECUTE format('REVOKE SELECT ON public.%I FROM %I', sensitive_table, '${role}');
            END IF;
          END LOOP;
        END
        $$;
      `);
    }
  });
};

const initReportStore = async (existingStore, connectionName, secret) => {
  const testMode = process.env.NODE_ENV === 'test';
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const password = reportingRolePassword(secret, role);
  await ensureReportingRole(existingStore, connectionName, password);

  const overrides = {
    ...resolveDbConfig(config.db),
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
