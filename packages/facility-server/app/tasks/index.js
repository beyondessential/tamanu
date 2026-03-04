import { SendStatusToMetaServer } from '@tamanu/shared/tasks/SendStatusToMetaServer';

import { mSupplyMedIntegrationProcessor } from './mSupplyMedIntegrationProcessor';
import { RefreshUpcomingVaccinations } from './RefreshMaterializedView';
import { TimeSyncTask } from './TimeSyncTask';

const DEFAULT_TASK_CLASSES = [
  RefreshUpcomingVaccinations,
  SendStatusToMetaServer,
  TimeSyncTask,
  mSupplyMedIntegrationProcessor,
];

export function startScheduledTasks(context, taskClasses) {
  const tasks = (taskClasses || DEFAULT_TASK_CLASSES).map(Task => new Task(context));

  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
