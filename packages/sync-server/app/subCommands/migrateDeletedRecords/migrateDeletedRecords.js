import { Command } from 'commander';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { log } from '@tamanu/shared/services/logging';
import { initDatabase } from '../../database';

const fromSurveyScreenComponent = async () => {
  const store = await initDatabase({ testMode: false });

  // If deleted_at column does not exist
  if (!store.models.SurveyScreenComponent.rawAttributes.deleted_at) {
    log.info(`Table 'survey_screen_components' does not have 'deleted_at' column`);
    return;
  }

  const response = await store.sequelize.query(
    `UPDATE "survey_screen_components" 
      SET "deleted_at" = NULL, "visibility_status" = :historical
      WHERE "deleted_at" IS NOT NULL`,
    {
      replacements: {
        historical: VISIBILITY_STATUSES.HISTORICAL,
      },
    },
  );

  log.info(
    `${response[1].rowCount} soft deleted records updated at survey_screen_components table`,
  );
};

const TABLE_TO_MIGRATION_MAPPING = {
  SurveyScreenComponent: fromSurveyScreenComponent,
};

export const runMigrate = async (migration, Resource) => {
  if (!migration) {
    log.error(`Subcommand migrateDeletedRecords: Resource ${Resource} is not supported`);
    process.exit(1);
  }

  log.info(`Starting Deleted records migration for ${Resource}...`);
  await migration();
  log.info(`Deleted records migration is done`);
};

/**
 * We have 'paranoid' option in Sequelize.js turned on for all tables for soft deletion.
 * Now we want to disable it for a few tables to control the soft deletion behaviours.
 * This command will migrate old deleted records with 'deletedAt' column to be using a different 'deletedAt' column,
 * so that we can delete the 'deletedAt' column.
 */
export const migrateDeletedRecords = async ({ migrate: Resource }) => {
  if (Resource === 'all') {
    for (const [resource, migration] of Object.entries(TABLE_TO_MIGRATION_MAPPING)) {
      await runMigrate(migration, resource);
    }
    process.exit(0);
  }

  const migration = TABLE_TO_MIGRATION_MAPPING[Resource];
  await runMigrate(migration, Resource);
  process.exit(0);
};

export const migrateDeletedRecordsCommand = new Command('deletedRecords')
  .description('Deleted records migration')
  .option(
    '--migrate <Resource>',
    'Deleted records migration for a given resource (use `all` to do migrate all non paranoid resources)',
  )
  .action(migrateDeletedRecords);
