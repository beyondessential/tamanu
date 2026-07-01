import config from 'config';

import {
  SendStatusToMetaServer,
  FhirMissingResources,
  startFhirWorkerTasks,
} from '@tamanu/shared/tasks';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { mSupplyMedIntegrationProcessor } from './mSupplyMedIntegrationProcessor';
import { MSupplyStockOnHandProcessor } from './MSupplyStockOnHandProcessor';
import { RefreshUpcomingVaccinations } from './RefreshMaterializedView';
import { TimeSyncTask } from './TimeSyncTask';

export { startFhirWorkerTasks };

const DEFAULT_TASK_CLASSES = [
  RefreshUpcomingVaccinations,
  SendStatusToMetaServer,
  TimeSyncTask,
  FhirMissingResources,
  mSupplyMedIntegrationProcessor,
  MSupplyStockOnHandProcessor,
];

// Resolved once at startup (idempotent); schedule changes apply on server restart.
// Tasks are server-wide, so on a multi-facility server the first facility's settings
// apply — same rule the mSupply tasks use.
export async function resolveSchedules(context) {
  const [primaryFacilityId] = selectFacilityIds(config);
  // eslint-disable-next-line require-atomic-updates
  context.schedules ??= await context.settings[primaryFacilityId].get('schedules');
  return context.schedules;
}

export async function startScheduledTasks(context, taskClasses) {
  await resolveSchedules(context);

  const tasks = (taskClasses || DEFAULT_TASK_CLASSES).map(Task => new Task(context));

  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
