/* eslint-disable no-param-reassign,no-return-assign */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { closeDatabase, initDatabase } from '../../utilities';
import { runPostMigration, runPreMigration } from '../../../src/services/migrations/migrationHooks';
import { tablesWithTrigger, tablesWithoutTrigger } from '../../../src/utils';
import { createMigrationInterface } from '../../../src/services/migrations/migrations';
import { log } from '@tamanu/shared/services/logging/log';
import { Umzug } from 'umzug';

const randomSelection = <T>(array: T[]) => array.filter(() => Math.random() > 0.5);

const sortTables = (a: { schema: string; table: string }, b: { schema: string; table: string }) => {
  if (a.schema === b.schema) {
    return a.table.localeCompare(b.table);
  }
  return a.schema.localeCompare(b.schema);
};

const addTrigger = async (
  sequelize: any,
  table: { schema: string; table: string },
  prefix: string,
  suffix: string,
) => {
  await removeTrigger(sequelize, table, prefix, suffix);
  return sequelize.query(
    `CREATE TRIGGER ${prefix}${table.table}${suffix} BEFORE INSERT OR UPDATE ON "${table.schema}"."${table.table}" FOR EACH ROW EXECUTE FUNCTION fake_trigger_function();`,
  );
};

const removeTrigger = (
  sequelize: any,
  table: { schema: string; table: string },
  prefix: string,
  suffix: string,
) => {
  return sequelize.query(
    `DROP TRIGGER IF EXISTS ${prefix}${table.table}${suffix} ON "${table.schema}"."${table.table}";`,
  );
};

const addFakeTriggerFunction = (sequelize: any) => {
  return sequelize.query(
    `CREATE OR REPLACE FUNCTION fake_trigger_function() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;`,
  );
};

const removeFakeTriggerFunction = (sequelize: any) => {
  return sequelize.query(`DROP FUNCTION IF EXISTS fake_trigger_function;`);
};

describe('migrationHooks', () => {
  let database: any;
  let umzug: Umzug;
  let allTables: { schema: string; table: string }[];

  beforeEach(async () => {
    database = await initDatabase();
    umzug = createMigrationInterface(log, database.sequelize);
    await runPreMigration(log, database.sequelize);
    await umzug.up();
    await runPostMigration(log, database.sequelize);
    await addFakeTriggerFunction(database.sequelize);
    allTables = (
      await database.sequelize.query(
        "SELECT table_schema as schema, table_name as table FROM information_schema.tables where table_schema IN ('public', 'logs') and table_type != 'VIEW'",
      )
    )[0];
  });

  afterEach(async () => {
    await removeFakeTriggerFunction(database.sequelize);
    await closeDatabase();
  });

  describe('tablesWithTrigger', () => {
    it('should return no tables for non-existing trigger', async () => {
      const tables = await tablesWithTrigger(database.sequelize, 'banana_', '_chocolate');
      expect(tables).toEqual([]);
    });

    it('should return tables that have a trigger', async () => {
      const prefix = 'cat_';
      const suffix = '_dog';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const tables = await tablesWithTrigger(database.sequelize, prefix, suffix);

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      expect(tables.sort(sortTables)).toEqual(triggeredTables.sort(sortTables));
    });

    it('should return tables that have a trigger even if it exceeds trigger character limit', async () => {
      const prefix = 'super_duper_long_trigger_name_';
      const suffix = '_really_silly_ridiculous_crazy_long_suffix';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const tables = await tablesWithTrigger(database.sequelize, prefix, suffix);

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      expect(tables.sort(sortTables)).toEqual(triggeredTables.sort(sortTables));
    });

    it('should not return tables that are flagged in the exclude list', async () => {
      const prefix = 'bird_';
      const suffix = '_bat';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const excludeTables = randomSelection(allTables);
      const tables = await tablesWithTrigger(
        database.sequelize,
        prefix,
        suffix,
        excludeTables.map(({ schema, table }) => `${schema}.${table}`),
      );

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      expect(tables.sort(sortTables)).toEqual(
        triggeredTables.filter(table => !excludeTables.includes(table)).sort(sortTables),
      );
    });
  });

  describe('tablesWithoutTrigger', () => {
    it('should return all tables for non-existing trigger', async () => {
      const tables = await tablesWithoutTrigger(database.sequelize, 'banana_', '_chocolate');
      expect(tables.sort(sortTables)).toEqual(allTables.sort(sortTables));
    });

    it('should return tables that do not have a trigger', async () => {
      const prefix = 'cat_';
      const suffix = '_dog';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const tables = await tablesWithoutTrigger(database.sequelize, prefix, suffix);

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      const expectedTables = allTables.filter(table => !triggeredTables.includes(table));
      expect(tables.sort(sortTables)).toEqual(expectedTables.sort(sortTables));
    });

    it('should return tables that do not have a trigger even if it exceeds trigger character limit', async () => {
      const prefix = 'super_duper_long_trigger_name_';
      const suffix = '_really_silly_ridiculous_crazy_long_suffix';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const tables = await tablesWithoutTrigger(database.sequelize, prefix, suffix);

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      const expectedTables = allTables.filter(table => !triggeredTables.includes(table));
      expect(tables.sort(sortTables)).toEqual(expectedTables.sort(sortTables));
    });

    it('should not return tables that are flagged in the exclude list', async () => {
      const prefix = 'bird_';
      const suffix = '_bat';
      const triggeredTables = randomSelection(allTables);
      for (const table of triggeredTables) {
        await addTrigger(database.sequelize, table, prefix, suffix);
      }

      const excludeTables = randomSelection(allTables);
      const tables = await tablesWithoutTrigger(
        database.sequelize,
        prefix,
        suffix,
        excludeTables.map(({ schema, table }) => `${schema}.${table}`),
      );

      for (const table of triggeredTables) {
        await removeTrigger(database.sequelize, table, prefix, suffix);
      }

      const expectedTables = allTables.filter(table => !triggeredTables.includes(table));
      expect(tables.sort(sortTables)).toEqual(
        expectedTables.filter(table => !excludeTables.includes(table)).sort(sortTables),
      );
    });
  });
});
