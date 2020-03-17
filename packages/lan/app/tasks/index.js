import config from 'config';
import { SenaitePoller } from './SenaitePoller';
import { VisitDischarger } from './VisitDischarger';

export function startScheduledTasks(database) {
  if (config.senaite.enabled) {
    const senaite = new SenaitePoller(database);
    senaite.beginPolling();
  }

  const discharger = new VisitDischarger(database);
  discharger.beginPolling();
}
