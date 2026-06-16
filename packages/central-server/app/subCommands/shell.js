import repl from 'repl';
import { homedir } from 'os';
import { join } from 'path';

import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { syncDatabaseServerVersion } from '@tamanu/database';

import { ApplicationContext } from '../ApplicationContext';
import pkg from '../../package.json';

export const shell = async ({ skipMigrationCheck, skipVersionCompatibilityCheck }) => {
  log.info(`Starting shell in Central Server ${pkg.version}!`);

  const context = await new ApplicationContext().init();
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });
  await syncDatabaseServerVersion({
    models: store.models,
    serverVersion: pkg.version,
    skipVersionCompatibilityCheck,
  });

  const replServer = await new Promise((resolve, reject) => {
    repl.start().setupHistory(join(homedir(), '.tamanu_repl_history'), (err, srv) => {
      if (err) reject(err);
      else resolve(srv);
    });
  });

  Object.assign(replServer.context, {
    context,
    store,
    models: store.models,
  });

  return new Promise(resolve => {
    replServer.on('exit', () => resolve());
  });
};

export const shellCommand = new Command('shell')
  .description('Start a Node.js shell')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--skipVersionCompatibilityCheck',
    'skip the database version compatibility check on startup',
  )
  .action(shell);
