import config from 'config';
// import { SenaitePoller } from './SenaitePoller';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { SyncTask } from './SyncTask';
import { log } from '@tamanu/shared/services/logging';
import { camelCase } from 'lodash';

const TASKS = [SyncTask, MedicationDiscontinuer];

export function startScheduledTasks(context) {
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const enabledTaskClasses = TASKS.filter(Task => {
    // check for explicit "false" value only
    // if not specified, default to enabled
    const isTaskDisabled = config.schedules[camelCase(Task.name)]?.enabled === false;
    if (isTaskDisabled) {
      log.info(`Skipping initialisation of task ${Task.name} as it is disabled in config`);
    }
    return !isTaskDisabled;
  });

  const tasks = enabledTaskClasses.map(Task => new Task(context));
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
