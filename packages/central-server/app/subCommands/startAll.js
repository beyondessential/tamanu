import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { JOB_TOPICS } from '@tamanu/constants';

import pkg from '../../package.json';
import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../ApplicationContext';
import { startApi } from './startApi';
import { startFhirWorker } from './startFhirWorker';
import { startTasks } from './startTasks';

export const serveAll = async ({ skipMigrationCheck, skipVersionCompatibilityCheck }) => {
  log.info(`Starting Tamanu Central version ${pkg.version}`);

  if (config.db.migrateOnStartup) {
    const { store } = await new ApplicationContext().init({
      appType: CENTRAL_SERVER_APP_TYPES.MIGRATE,
    });
    await store.sequelize.migrate('up', {
      serverVersion: pkg.version,
      skipVersionCompatibilityCheck,
    });
  }

  return Promise.race([
    startApi({ skipMigrationCheck, skipVersionCompatibilityCheck }),
    startFhirWorker({
      name: 'refresh',
      skipMigrationCheck,
      skipVersionCompatibilityCheck,
      topics: [
        JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM,
        JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE,
        JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
      ].join(','),
    }),
    // Run the fhir.resolver topic in a separate worker, as currently it can take a long time and may block the queue (SAV-813)
    startFhirWorker({
      name: 'resolver',
      skipMigrationCheck,
      skipVersionCompatibilityCheck,
      topics: JOB_TOPICS.FHIR.RESOLVER,
    }),
    startTasks({ skipMigrationCheck, skipVersionCompatibilityCheck }),
  ]);
};

export const startAllCommand = new Command('startAll')
  .alias('serveAll') // deprecated
  .description('Start the Tamanu Central servers and tasks runners')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--skipVersionCompatibilityCheck',
    'skip the database version compatibility check on startup',
  )
  .action(serveAll);
