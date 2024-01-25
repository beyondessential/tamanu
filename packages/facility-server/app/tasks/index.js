// import { SenaitePoller } from './SenaitePoller';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { SyncTask } from './SyncTask';

const TASKS = [SyncTask, MedicationDiscontinuer];

export function startScheduledTasks(context) {
  const tasks = TASKS.map(Task => new Task(context));
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
