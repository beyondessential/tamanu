import config from 'config';
import { SenaitePoller } from './SenaitePoller';
import { VisitDischarger } from './VisitDischarger';

export function startScheduledTasks(context) {
  if (config.senaite.enabled) {
    // TODO: port to new backend
    // const senaite = new SenaitePoller(context);
    // senaite.beginPolling();
  }

  const discharger = new VisitDischarger(context);
  discharger.beginPolling();
}
