import { SenaitePoller } from './SenaitePoller';
import config from 'config';

export function startScheduledTasks(database) {
  if(config.senaite.enabled) {
    const senaite = new SenaitePoller(database);
    senaite.beginPolling();
    
    // TODO: TEMP CODE DELETE THIS
    setTimeout(() => senaite.run(), 1000);
  }
}
