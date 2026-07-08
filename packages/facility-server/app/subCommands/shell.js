import repl from 'repl';
import { homedir } from 'os';
import { join } from 'path';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { prepareDatabaseForStartup } from '../database';
import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { getServerFacilityIds } from '../serverConfig';

export const shell = async ({ skipMigrationCheck }) => {
  const context = await new ApplicationContext().init();
  const facilityIds = getServerFacilityIds() ?? [];
  log.info(`Starting shell in Facility Server ${version} ${facilityIds.join(', ')}`);

  await prepareDatabaseForStartup(context, { skipMigrationCheck });

  const replServer = await new Promise((resolve, reject) => {
    repl.start().setupHistory(join(homedir(), '.tamanu_repl_history'), (err, srv) => {
      if (err) reject(err);
      else resolve(srv);
    });
  });

  Object.assign(replServer.context, {
    context,
    models: context.models,
  });

  return new Promise(resolve => {
    replServer.on('exit', () => resolve());
  });
};

export const shellCommand = new Command('shell').description('Start a Node.js shell').action(shell);
