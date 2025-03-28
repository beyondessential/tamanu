import config from 'config';

import { SendStatusToMetaServer } from '@tamanu/shared/tasks/SendStatusToMetaServer';

// import { SenaitePoller } from './SenaitePoller';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { RefreshUpcomingVaccinations } from './RefreshMaterializedView';

const DEFAULT_TASK_CLASSES = [
  MedicationDiscontinuer,
  RefreshUpcomingVaccinations,
  SendStatusToMetaServer,
];

export function startScheduledTasks(context, taskClasses) {
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const tasks = (taskClasses || DEFAULT_TASK_CLASSES).map((Task) => new Task(context));

  tasks.forEach((t) => t.beginPolling());
  return () => tasks.forEach((t) => t.cancelPolling());
}
