import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { version } from '../../package.json';
import { ApplicationContext } from '../ApplicationContext';
import { serve } from './serve';
import { tasks } from './tasks';

export const serveAll = async ({ skipMigrationCheck }) => {
  log.info(`Starting sync server and tasks runner version ${version}.`);

  if (config.db.migrateOnStartup) {
    const { store } = await new ApplicationContext().init();
    await store.sequelize.migrate('up');
  }

  return Promise.race([serve({ skipMigrationCheck }), tasks({ skipMigrationCheck })]);
};

export const serveAllCommand = new Command('serveAll')
  .description('Start the Tamanu sync server and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(serveAll);
