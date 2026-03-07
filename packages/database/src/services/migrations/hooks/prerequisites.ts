import { QueryTypes, type Sequelize } from 'sequelize';
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

async function migrationApplied(sequelize: Sequelize, migrationName: string): Promise<boolean> {
  const rows = await sequelize.query(
    'select count(*) as count from "SequelizeMeta" where name = $name',
    {
      type: QueryTypes.SELECT,
      bind: { name: migrationName },
    },
  );
  const row = rows?.[0] as { count: number } | undefined;
  return (row?.count ?? 0) > 0;
}

/** Pre-requisite: the given PostgreSQL function exists in the database. */
export function requireFunction(name: string): Prerequisite {
  return async context => await functionExists(context.sequelize, name);
}

/**
 * Pre-requisite: the given migration has been run on the database. Use when a hook depends on a migration.
 */
export function requireMigration(migrationName: string): Prerequisite {
  return async context => await migrationApplied(context.sequelize, migrationName);
}

/**
 * Pre-requisite: the given migration has not been run on the database. Use when a hook should not be run after a certain migration.
 */
export function requireMigrationNotApplied(migrationName: string): Prerequisite {
  return async context => !(await migrationApplied(context.sequelize, migrationName));
}
