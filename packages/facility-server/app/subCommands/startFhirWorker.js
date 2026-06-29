import config from 'config';
import { Command } from 'commander';

import { runStartFhirWorker } from '@tamanu/shared/tasks';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';

const defaults = {
  appType: 'fhir-worker',
  serverName: 'Facility',
  version,
};

export async function startFhirWorker(opts = {}) {
  const {
    skipMigrationCheck,
    topics,
    name,
    appType = defaults.appType,
    serverName = defaults.serverName,
    version = defaults.version,
  } = { ...defaults, ...opts };

  const dbKey = name ? `${appType}(${name})` : appType;
  const context = await new ApplicationContext().init({ appType, dbKey });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  const facilityIds = selectFacilityIds(config);
  // Per-facility ReadSettings (facility → global cascade). When multiple facilities are
  // configured, the first id matches ApplicationContext ordering; fhir.worker.* usually
  // resolves from the global layer anyway unless overridden per facility.
  const settings =
    facilityIds?.length > 0 ? context.settings[facilityIds[0]] : context.settings.global;

  return runStartFhirWorker({
    context,
    settings,
    serverName,
    version,
    topics,
  });
}

export const startFhirWorkerCommand = new Command('startFhirWorker')
  .description('Start the Tamanu Facility FHIR worker')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option('--topics <topics>', 'comma-separated topics to work on, defaults to all')
  .action(startFhirWorker);
