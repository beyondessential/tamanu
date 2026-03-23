import { Command } from 'commander';

import { runStartFhirWorker } from '@tamanu/shared/tasks';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../ApplicationContext';
import pkg from '../../package.json';

const options = {
  ApplicationContext,
  appType: CENTRAL_SERVER_APP_TYPES.FHIR_WORKER,
  serverName: 'Central',
  version: pkg.version,
};

export const startFhirWorker = opts => runStartFhirWorker({ ...options, ...opts });

export const startFhirWorkerCommand = new Command('startFhirWorker')
  .description('Start the Tamanu Central FHIR worker')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option('--topics <topics>', 'comma-separated topics to work on, defaults to all')
  .action(startFhirWorker);
