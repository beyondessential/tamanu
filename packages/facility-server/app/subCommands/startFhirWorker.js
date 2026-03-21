import { Command } from 'commander';

import { runStartFhirWorker } from '@tamanu/shared/tasks';

import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';

const options = {
  ApplicationContext,
  appType: 'fhir-worker',
  serverName: 'Facility',
  version,
};

export const startFhirWorker = opts => runStartFhirWorker({ ...options, ...opts });

export const startFhirWorkerCommand = new Command('startFhirWorker')
  .description('Start the Tamanu Facility FHIR worker')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option('--topics <topics>', 'comma-separated topics to work on, defaults to all')
  .action(startFhirWorker);
