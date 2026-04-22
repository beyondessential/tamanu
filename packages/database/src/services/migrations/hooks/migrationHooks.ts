import type { Sequelize } from 'sequelize';
import type { Logger } from 'winston';
import { PRE_MIGRATION_HOOKS } from './preMigrationHooks';
import { POST_MIGRATION_HOOKS } from './postMigrationHooks';
import type { HookContext, MigrationHook } from './types';

const runHooks = async (hooks: MigrationHook[], context: HookContext) => {
  for (const hook of hooks) {
    const results = await Promise.all(hook.prerequisites.map(p => p(context)));
    const allPassed = results.every(Boolean);
    if (!allPassed) {
      context.log.info(`Migration hook: ${hook.name} skipped`);
      continue;
    }
    context.log.info(`Migration hook: ${hook.name} running`);
    await hook.run(context);
    context.log.info(`Migration hook: ${hook.name} completed`);
  }
};

export async function runPreMigration(log: Logger, sequelize: Sequelize) {
  log.info('Running pre-migration steps...');
  await runHooks(PRE_MIGRATION_HOOKS, { log, sequelize });
}

export async function runPostMigration(log: Logger, sequelize: Sequelize) {
  log.info('Running post-migration steps...');
  await runHooks(POST_MIGRATION_HOOKS, { log, sequelize });
}
