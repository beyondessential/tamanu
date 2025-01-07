import config from 'config';
import repl from 'repl';
import { homedir } from 'os';
import { join } from 'path';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

export const shell = async ({ skipMigrationCheck }) => {
  const facilityIds = selectFacilityIds(config);
  log.info(`Starting shell in Facility Server ${version} ${facilityIds.join(', ')}`);

  const context = await new ApplicationContext().init();

  await context.sequelize.assertUpToDate({ skipMigrationCheck });

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
