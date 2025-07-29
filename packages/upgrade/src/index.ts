import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_VERSION } from '@tamanu/constants';
import { createMigrationInterface, migrateUpTo } from '@tamanu/database/services/migrations';
import type { Models, Sequelize } from '@tamanu/database';
import { listSteps, MIGRATIONS_END } from './listSteps.js';
import { END, MIGRATION_PREFIX, migrationFile, onlyMigrations, START } from './step.js';
import type { MigrationStr, StepArgs } from './step.ts';
export type * from './step.ts';
export * from './step.js';

const EARLIEST_MIGRATION = '1739968205100-addLSFFunction';

export async function upgrade({
  sequelize,
  models,
  toVersion,
  serverType,
}: {
  sequelize: Sequelize;
  models: Models;
  toVersion: string;
  serverType: 'central' | 'facility';
}) {
  const fromVersion =
    (await models.LocalSystemFact.get(FACT_CURRENT_VERSION).catch((err) => {
      log.error('Failed to get current version, likely because there is not one recorded yet', err);
      return null;
    })) ?? '0.0.0';
  log.info('Upgrading Tamanu installation', { from: fromVersion, to: toVersion });

  const migrations = createMigrationInterface(log, sequelize);
  let pendingMigrations = await migrations.pending();
  let doneMigrations = await migrations.executed();

  const pendingEarliestMigration = pendingMigrations.find((mig) =>
    mig.testFileName(EARLIEST_MIGRATION),
  );
  if (pendingEarliestMigration) {
    await migrateUpTo({
      log,
      sequelize,
      pending: pendingMigrations,
      migrations,
      upOpts: { to: pendingEarliestMigration.file },
    });
    pendingMigrations = await migrations.pending();
    doneMigrations = await migrations.executed();
  }

  log.debug('Loading upgrade steps');
  const { order, steps } = await listSteps();
  log.debug('Loaded upgrade steps', { count: steps.size });

  const stepArgs: Omit<StepArgs, 'log'> = {
    sequelize,
    models,
    fromVersion,
    toVersion,
    serverType,
  };

  for (const id of order) {
    const logger = log.child({ step: id });
    const args: StepArgs = { ...stepArgs, log: logger };

    if (id === MIGRATIONS_END) {
      logger.debug('Run through all remaining migrations');
      await migrateUpTo({
        log: logger,
        sequelize,
        pending: pendingMigrations,
        migrations,
        upOpts: {},
      });
      continue;
    }

    if (id.endsWith(START) || id.endsWith(END)) {
      // virtual step, skip
      continue;
    }

    if (id.startsWith(MIGRATION_PREFIX)) {
      const target = pendingMigrations.find((mig) =>
        mig.testFileName(migrationFile(id as MigrationStr)),
      );
      if (target) {
        await migrateUpTo({
          log: logger,
          sequelize,
          pending: pendingMigrations,
          migrations,
          upOpts: { to: target.file },
        });
      }
      continue;
    }

    const entry = steps.get(id);
    if (!entry) {
      logger.warn('Missing step (bug!)');
      continue;
    }
    const { step } = entry;

    // before:Migration[] will only run if the migrations haven't run yet
    const beforeMigrations = onlyMigrations(step.before);
    if (
      beforeMigrations.length > 0 &&
      beforeMigrations.every((need) => doneMigrations.some((mig) => mig.testFileName(need)))
    ) {
      logger.debug('Step has no before:Migration that has not already run, skipping');
      continue;
    }

    // after:Migration[] will only run if the migrations hadn't run yet *before starting this upgrade*
    // (the topo sort ensures that the migrations did run at this point in the loop)
    const afterMigrations = onlyMigrations(step.after);
    if (
      afterMigrations.length > 0 &&
      afterMigrations.every((need) => doneMigrations.some((mig) => mig.testFileName(need)))
    ) {
      logger.debug('Step has no after:Migration that had not already run, skipping');
      continue;
    }

    logger.debug('Running check');
    if (!(await step.check(args))) continue;

    logger.info('Running step');
    await step.run(args);
  }

  log.info('Tamanu has been upgraded', { toVersion });
  await models.LocalSystemFact.set(FACT_CURRENT_VERSION, toVersion);
}
