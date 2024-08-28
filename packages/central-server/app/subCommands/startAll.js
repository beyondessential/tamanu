import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import pkg from '../../package.json';
import { ApplicationContext } from '../ApplicationContext';
import { startApi } from './startApi';
import { startFhirWorker } from './startFhirWorker';
import { startTasks } from './startTasks';

export const serveAll = async ({ skipMigrationCheck }) => {
  log.info(`Starting Tamanu Central version ${pkg.version}`);

  if (config.db.migrateOnStartup) {
    const { store } = await new ApplicationContext().init({ appType: 'migrate' });
    await store.sequelize.migrate('up');
  }

  return Promise.race([
    startApi({ skipMigrationCheck }),
    startFhirWorker({ skipMigrationCheck }),
    startTasks({ skipMigrationCheck }),
  ]);
};

export const startAllCommand = new Command('startAll')
  .alias('serveAll') // deprecated
  .description('Start the Tamanu Central servers and tasks runners')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(serveAll);
