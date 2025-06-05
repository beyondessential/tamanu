import { log } from '@tamanu/shared/services/logging';
import { createMigrationInterface, migrateUpTo } from '@tamanu/database/services/migrations';
import type { Models, Sequelize } from '@tamanu/database';
import { listSteps, MIGRATION_PREFIX, START, END } from './listSteps';

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
  const fromVersion = (await models.LocalSystemFact.get('version')) ?? '0.0.0';
  log.info('Upgrading Tamanu installation', { from: fromVersion, to: toVersion });

  log.debug('Loading upgrade steps');
  const { order, steps } = await listSteps();
  log.debug('Loaded upgrade steps', { count: steps.size });

  const migrations = createMigrationInterface(log, sequelize);
  const pendingMigrations = await migrations.pending();
  const doneMigrations = await migrations.executed();

  const stepArgs = {
    sequelize,
    models,
    fromVersion,
    toVersion,
    serverType,
  };

  for (const id of order) {
    const logger = log.child({ step: id });
    const args = { ...stepArgs, log: logger };

    if (id.startsWith(START) || id.startsWith(END)) continue;

    if (id.startsWith(MIGRATION_PREFIX)) {
      const migrationFile = id.substring(MIGRATION_PREFIX.length);
      const target = pendingMigrations.find((mig) => mig.testFileName(migrationFile));
      if (target) {
        await migrateUpTo({
          log: logger,
          sequelize,
          pending: pendingMigrations,
          migrations,
          upOpts: { to: target },
        });
      }
      continue;
    }

    const entry = steps.get(id);
    if (!entry) {
      logger.warn('Missing step (bug?)');
      continue;
    }
    const { step } = entry;

    // beforeMigration will only run if the migration hasn't run yet
    const beforeMigration = (step as any)['beforeMigration'] as string | undefined;
    if (beforeMigration && doneMigrations.some((mig) => mig.testFileName(beforeMigration))) {
      logger.debug('Step has beforeMigration that has already run, skipping');
      continue;
    }

    // afterMigration will only run if the migration hadn't run yet before starting this upgrade
    // (the topo sort ensures that the migration has run at this point)
    const afterMigration = (step as any)['afterMigration'] as string | undefined;
    if (afterMigration && doneMigrations.some((mig) => mig.testFileName(afterMigration))) {
      logger.debug('Step has afterMigration that had already run, skipping');
      continue;
    }

    logger.debug('Running check');
    if (step.check && !(await step.check(args))) continue;

    logger.info('Running step');
    await step.run(args);
  }

  log.info('Tamanu has been upgraded', { toVersion });
  await models.LocalSystemFact.set('version', toVersion);
}
