import repl from 'repl';
import { homedir } from 'os';
import { join } from 'path';

import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import pkg from '../../package.json';

export const shell = async ({ skipMigrationCheck }) => {
  log.info(`Starting shell in Central Server ${pkg.version}!`);

  const context = await new ApplicationContext().init();
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const replServer = await new Promise((resolve, reject) =>
    repl.start().setupHistory(join(homedir(), '.tamanu_repl_history'), (err, srv) => {
      if (err) reject(err);
      else resolve(srv);
    }),
  );

  Object.assign(replServer.context, {
    context,
    store,
    models: store.models,
  });

  return new Promise(resolve => replServer.on('exit', () => resolve()));
};

export const shellCommand = new Command('shell').description('Start a Node.js shell').action(shell);
