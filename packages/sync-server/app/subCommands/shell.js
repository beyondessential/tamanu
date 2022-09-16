import repl from 'node:repl';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { Command } from 'commander';

import { log } from 'shared/services/logging';

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
  return new Promise(resolve =>
    replServer.on('exit', () => {
      console.log('Received "exit" event from repl!');
      resolve();
      process.exit();
    }),
  );
};

export const shellCommand = new Command('shell').description('Start a Node.js shell').action(shell);
