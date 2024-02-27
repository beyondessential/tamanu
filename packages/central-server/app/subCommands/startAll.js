import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import pkg from '../../package.json';
import { ApplicationContext } from '../ApplicationContext';
import { provision } from './provision';
import { startApi } from './serve';
import { startTasks } from './tasks';

export const serveAll = async ({ skipMigrationCheck, provisioning }) => {
  if (provisioning) {
    await provision(provisioning, { skipIfNotNeeded: true });
  }

  log.info(`Starting Tamanu Central version ${pkg.version}`);

  if (config.db.migrateOnStartup) {
    const { store } = await new ApplicationContext().init({ appType: 'migrate' });
    await store.sequelize.migrate('up');
  }

  return Promise.race([startApi({ skipMigrationCheck }), startTasks({ skipMigrationCheck })]);
};

export const startAllCommand = new Command('startAll')
  .alias('serveAll') // deprecated
  .description('Start the Tamanu Central servers and tasks runners')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--provisioning <file>',
    'if provided and no users exist, provision Tamanu from this file',
  )
  .action(serveAll);
