import config from 'config';
import { SenaitePoller } from './SenaitePoller';

export function startScheduledTasks(database) {
  if (config.senaite.enabled) {
    const senaite = new SenaitePoller(database);
    senaite.beginPolling();
  }
}
