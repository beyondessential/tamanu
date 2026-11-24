import {
  FhirErroredJobCleaner,
  FhirJobWorkerCleaner,
  FhirMissingResources,
  recordScheduledTaskRuns,
  startFhirWorkerTasks,
} from '@tamanu/shared/tasks';
import { facilityDefaults, globalDefaults } from '@tamanu/settings';

import { getServerFacilityIds } from '../serverConfig';

import { BedFeeCharger } from './BedFeeCharger';
import { mSupplyMedIntegrationProcessor } from './mSupplyMedIntegrationProcessor';
import { MSupplyStockOnHandProcessor } from './MSupplyStockOnHandProcessor';
import { RefreshUpcomingVaccinations } from './RefreshMaterializedView';
import { TimeSyncTask } from './TimeSyncTask';
import { CleanupIdempotencyKeys } from './CleanupIdempotencyKeys';
import { CleanupBrowserTelemetry } from '@tamanu/shared/tasks/CleanupBrowserTelemetry';

export { startFhirWorkerTasks };

const DEFAULT_TASK_CLASSES = [
  RefreshUpcomingVaccinations,
  TimeSyncTask,
  FhirMissingResources,
  FhirJobWorkerCleaner,
  FhirErroredJobCleaner,
  mSupplyMedIntegrationProcessor,
  MSupplyStockOnHandProcessor,
  BedFeeCharger,
  CleanupIdempotencyKeys,
  CleanupBrowserTelemetry,
];

// The schedules are read once and kept, so a change to them needs a restart.
// Tasks belong to the server rather than a facility, so on a server with several facilities we use
// the first one's settings, as the mSupply tasks do. A server that started unconfigured has no
// facility yet and uses the schema defaults until it is restarted.
export async function resolveSchedules(context) {
  const [primaryFacilityId] = getServerFacilityIds() ?? [];
  // eslint-disable-next-line require-atomic-updates
  context.schedules ??= primaryFacilityId
    ? await context.settings[primaryFacilityId].get('schedules')
    : facilityDefaults.schedules;
  // Telemetry is a global setting; the facility reader merges global scope, so it
  // resolves through the facility reader (global defaults before the wizard runs).
  // eslint-disable-next-line require-atomic-updates
  context.telemetrySettings ??= primaryFacilityId
    ? await context.settings[primaryFacilityId].get('telemetry')
    : globalDefaults.telemetry;
  return context.schedules;
}

export async function startScheduledTasks(context, taskClasses) {
  await resolveSchedules(context);

  const tasks = (taskClasses || DEFAULT_TASK_CLASSES).map(Task => new Task(context));
  await recordScheduledTaskRuns(tasks, context.models);

  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
