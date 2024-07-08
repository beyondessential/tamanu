import config from 'config';

// import { SenaitePoller } from './SenaitePoller';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { SyncTask } from './SyncTask';
import { RefreshUpcomingVaccinations } from './RefreshMaterializedView';

const TASK_CLASSES = [SyncTask, MedicationDiscontinuer, RefreshUpcomingVaccinations];

export function startScheduledTasks(context) {
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const tasks = TASK_CLASSES.map(Task => new Task(context));

  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
