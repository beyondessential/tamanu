import crypto from 'crypto';
import config from 'config';
import { QueryTypes } from 'sequelize';

import {
  REPORT_DB_CONNECTION_ROLES,
  REPORT_DB_CONNECTION_SCHEMAS,
  REPORT_DB_CONNECTION_VALUES,
  FACT_REPORTING_ROLE_SECRET,
  FACT_REPORTING_SECRET_ROTATED_AT,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { log } from '@tamanu/shared/services/logging';
import { ReadSettings } from '@tamanu/settings/reader';
import { openDatabase } from './database';
import { resolveDbConfig } from './connectionConfig';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// int8 keys above the int4 range hashtext() returns, so they can't collide with other locks.
const REPORTING_ROLES_LOCK_KEY = '7829301042';
const REPORTING_SECRET_LOCK_KEY = '7829301043';

// Tables holding credentials/tokens/signing keys that report SQL must never read.
// The raw role gets SELECT on all of public, so it's revoked on these.
const REPORTING_SENSITIVE_TABLES = [
  'local_system_secrets',
  'one_time_logins',
  'portal_one_time_tokens',
  'refresh_tokens',
  'signers',
  'signers_historical',
];

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
  crypto.createHmac('sha256', secret).update(`tamanu-report-role:${role}`).digest('hex');

// The advisory lock makes concurrently-starting processes converge on one secret
// rather than each generating its own.
export const getReportingSecret = async ({ models, sequelize }) => {
  const rotationDays = await new ReadSettings(models).get('reportingDb.secretRotationDays');
  return sequelize.transaction(async () => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${REPORTING_SECRET_LOCK_KEY}::bigint);`);

    const existing = await models.LocalSystemSecret.get(FACT_REPORTING_ROLE_SECRET);
    let rotatedAt = await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT);
    if (existing) {
      // Pre-existing secret with no timestamp: seed it so rotation can start.
      if (!rotatedAt) {
        rotatedAt = getCurrentDateTimeString();
        await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, rotatedAt);
      }
      if (!isReportingSecretStale(rotatedAt, rotationDays)) return existing;
    }

    const secret = crypto.randomBytes(32).toString('hex');
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, secret);
    await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, getCurrentDateTimeString());
    return secret;
  });
};

// Catalog DDL (GRANT etc) updates pg_class rows, which can race autovacuum's
// in-place catalog updates: "tuple concurrently updated" (XX000). The advisory
// lock below only serialises our own processes, not background workers. Fixed
// upstream in the 2024-11 postgres minors (e.g. 12.21), but deployments run
// older; the DDL is idempotent, so just retry.
const CATALOG_RACE_ATTEMPTS = 3;
const withCatalogRaceRetry = async (label, fn) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const code = error?.original?.code ?? error?.parent?.code;
      if (code !== 'XX000' || attempt >= CATALOG_RACE_ATTEMPTS) throw error;
      log.warn(`${label}: retrying after catalog update race`, { attempt });
      await new Promise(resolve => {
        setTimeout(resolve, 500 * attempt);
      });
    }
  }
};

const grantSchemaAccess = async (sequelize, role, schema) => {
  if (schema !== 'public') {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    // Lets reporting reports reference tables without the schema prefix.
    await sequelize.query(`ALTER ROLE "${role}" SET search_path TO "${schema}";`);
  }

  await sequelize.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}";`);
  await sequelize.query(`GRANT SELECT ON ALL TABLES IN SCHEMA "${schema}" TO "${role}";`);
  // Covers tables created later (e.g. materialised reporting tables), but only
  // ones this role creates, and a DROP SCHEMA takes the entry with it.
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
    const sensitiveTablesArray = REPORTING_SENSITIVE_TABLES.map(table => `'${table}'`).join(', ');
    await sequelize.query(`
      DO $$
      DECLARE
        sensitive_table text;
      BEGIN
        FOREACH sensitive_table IN ARRAY ARRAY[${sensitiveTablesArray}] LOOP
          IF to_regclass('public.' || sensitive_table) IS NOT NULL THEN
            EXECUTE format('REVOKE SELECT ON public.%I FROM %I', sensitive_table, '${role}');
          END IF;
        END LOOP;
      END
      $$;
    `);
  }
};

const reportingRoleExists = async (sequelize, role) => {
  const [existing] = await sequelize.query('SELECT 1 FROM pg_roles WHERE rolname = :role;', {
    type: QueryTypes.SELECT,
    replacements: { role },
  });
  return Boolean(existing);
};

const ensureReportingRole = async (existingStore, connectionName, password) => {
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];
  const { sequelize } = existingStore;

  // The central app types (api, fhir workers, tasks) all init concurrently and
  // would race on these cluster-global role objects ("tuple concurrently
  // updated"). Serialise with a transaction-scoped advisory lock; the DDL is
  // idempotent so re-applying it once per startup is harmless.
  await withCatalogRaceRetry(`ensureReportingRole(${role})`, () =>
    sequelize.transaction(async () => {
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

      await grantSchemaAccess(sequelize, role, schema);
    }),
  );
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

// `GRANT SELECT ON ALL TABLES` only covers what exists when it runs, and the
// default privileges above only cover objects this role creates. So a reporting
// build that recreates the schema, or that creates its views as another role,
// leaves the role able to log in and read nothing.
const countMissingGrantsFor = async (sequelize, connectionName) => {
  const role = REPORT_DB_CONNECTION_ROLES[connectionName];
  const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];

  // Startup owns creating the roles; there's nothing to grant to without one.
  if (!(await reportingRoleExists(sequelize, role))) return 0;

  // Revoked on purpose, so their missing SELECT isn't a signal.
  const excludedTables = schema === 'public' ? REPORTING_SENSITIVE_TABLES : [];
  const excludedArray = `ARRAY[${excludedTables.map(table => `'${table}'`).join(', ')}]::text[]`;

  const [counts] = await sequelize.query(
    `
    SELECT
      (SELECT count(*)
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = :schema
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND c.relname <> ALL(${excludedArray})
          AND has_table_privilege(current_user, c.oid, 'SELECT WITH GRANT OPTION')
          AND NOT has_table_privilege(:role, c.oid, 'SELECT'))::int AS unreadable_objects,
      -- Someone else's objects (a reporting build running as another role): only
      -- their owner can grant on them, so re-running our grants won't help.
      (SELECT count(*)
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = :schema
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND NOT has_table_privilege(current_user, c.oid, 'SELECT WITH GRANT OPTION')
          AND NOT has_table_privilege(:role, c.oid, 'SELECT'))::int AS ungrantable_objects,
      (SELECT count(*)
         FROM pg_namespace
        WHERE nspname = :schema
          AND NOT has_schema_privilege(:role, oid, 'USAGE'))::int AS schema_usage_missing,
      (SELECT CASE WHEN EXISTS (
          SELECT 1
            FROM pg_default_acl d
            JOIN pg_namespace n ON n.oid = d.defaclnamespace
            CROSS JOIN aclexplode(d.defaclacl) acl
           WHERE n.nspname = :schema
             AND d.defaclobjtype = 'r'
             AND d.defaclrole = current_user::regrole
             AND acl.grantee = (SELECT oid FROM pg_roles WHERE rolname = :role)
             AND acl.privilege_type = 'SELECT'
        ) THEN 0 ELSE 1 END) AS default_privileges_missing;
  `,
    { type: QueryTypes.SELECT, replacements: { role, schema } },
  );

  const missing =
    counts.unreadable_objects + counts.schema_usage_missing + counts.default_privileges_missing;
  if (missing > 0 || counts.ungrantable_objects > 0) {
    log.warn('Reporting grants incomplete', { role, schema, ...counts });
  }
  return missing;
};

export const countMissingReportingGrants = async ({ sequelize }) => {
  const counts = [];
  for (const connectionName of REPORT_DB_CONNECTION_VALUES) {
    counts.push(await countMissingGrantsFor(sequelize, connectionName));
  }
  return counts.reduce((total, count) => total + count, 0);
};

export const refreshReportingGrants = async ({ sequelize }) => {
  // Sequential: concurrent role/schema DDL on the same db can deadlock.
  for (const connectionName of REPORT_DB_CONNECTION_VALUES) {
    const role = REPORT_DB_CONNECTION_ROLES[connectionName];
    const schema = REPORT_DB_CONNECTION_SCHEMAS[connectionName];
    if (!(await reportingRoleExists(sequelize, role))) continue;

    await withCatalogRaceRetry(`refreshReportingGrants(${role})`, () =>
      sequelize.transaction(async () => {
        await sequelize.query(`SELECT pg_advisory_xact_lock(${REPORTING_ROLES_LOCK_KEY}::bigint);`);
        await grantSchemaAccess(sequelize, role, schema);
      }),
    );
  }
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
