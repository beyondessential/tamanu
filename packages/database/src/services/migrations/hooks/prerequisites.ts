import { QueryTypes, type Sequelize } from 'sequelize';
import { REPORT_DB_CONNECTIONS, REPORT_DB_CONNECTION_SCHEMAS } from '@tamanu/constants';
import type { Prerequisite } from './types';

async function functionExists(sequelize: Sequelize, name: string): Promise<boolean> {
  const rows = await sequelize.query(
    'select count(*) as count from pg_catalog.pg_proc where proname = $name',
    {
      type: QueryTypes.SELECT,
      bind: { name },
    },
  );
  const row = rows?.[0] as { count: number } | undefined;
  return (row?.count ?? 0) > 0;
}

/** Pre-requisite: the given PostgreSQL function exists in the database. */
export function requireFunction(name: string): Prerequisite {
  return async context => await functionExists(context.sequelize, name);
}

async function tableExists(sequelize: Sequelize, name: string): Promise<boolean> {
  const rows = await sequelize.query(
    "select count(*) as count from information_schema.tables where table_schema = 'public' and table_name = $name",
    {
      type: QueryTypes.SELECT,
      bind: { name },
    },
  );
  const row = rows?.[0] as { count: number } | undefined;
  return (row?.count ?? 0) > 0;
}

/**
 * Pre-requisite: the given table exists in the public schema. Guards hooks that read/write
 * local_system_facts against running before the baseline migration has created it.
 */
export function requireTable(name: string): Prerequisite {
  return async context => await tableExists(context.sequelize, name);
}

// `<version> sha256-<digest>`, the stamp bestool alertd leaves on a reporting schema it applied.
const MANAGED_REPORTING_STAMP = '^\\S+ sha256-[A-Za-z0-9+/]{43}=$';

/** Pre-requisite: the reporting schema is one bestool alertd applied, and so will reapply. */
export const requireManagedReportingSchema: Prerequisite = async ({ sequelize }) => {
  const rows = await sequelize.query(
    `select count(*) as count from pg_catalog.pg_namespace
     where nspname = $schema and obj_description(oid, 'pg_namespace') ~ $stamp`,
    {
      type: QueryTypes.SELECT,
      bind: {
        schema: REPORT_DB_CONNECTION_SCHEMAS[REPORT_DB_CONNECTIONS.REPORTING],
        stamp: MANAGED_REPORTING_STAMP,
      },
    },
  );
  const row = rows?.[0] as { count: number } | undefined;
  return Number(row?.count ?? 0) > 0;
};
