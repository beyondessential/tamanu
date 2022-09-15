import repl from 'node:repl';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import pkg from '../../package.json';

export const shell = async ({ skipMigrationCheck }) => {
  log.info(`Starting shell in Central Server ${pkg.version}!`);

  const context = await new ApplicationContext().init();
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const replServer = repl.start();
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
