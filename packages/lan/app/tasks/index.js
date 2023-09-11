import config from 'config';
// import { SenaitePoller } from './SenaitePoller';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { SyncTask } from './SyncTask';

const TASKS = [SyncTask, MedicationDiscontinuer];

export function startScheduledTasks(context) {
  // TODO: use db fetcher config
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const tasks = TASKS.map(Task => new Task(context));
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
