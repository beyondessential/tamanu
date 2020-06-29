import config from 'config';
import { SenaitePoller } from './SenaitePoller';
import { EncounterDischarger } from './EncounterDischarger';

export function startScheduledTasks(context) {
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const discharger = new EncounterDischarger(context);
  discharger.beginPolling();
}
