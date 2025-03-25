import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';
import { ScheduledTask } from './ScheduledTask';
import { serviceContext } from '../services/logging/context';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export class SendStatusToMetaServer extends ScheduledTask {
  getName() {
    return 'SendStatusToMetaServer';
  }
  constructor(context, overrideConfig = null) {
    const { schedule, jitterTime, enabled } =
      overrideConfig || config.schedules.sendStatusToMetaServer;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.store.models;
    this.metaserverHost = config.metaServer.host;
  }

  async run() {
    const mockServerId = '00000000-0000-0000-0000-000000000000';
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const currentSyncTick = await this.models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
    const response = await fetchWithTimeout(`${this.metaserverHost}/status/${mockServerId}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Tamanu-Client': serverType,
        'X-Version': version,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.countryTimeZone,
      }),
      timeout: 20000,
    });
    console.log(response, `${this.metaserverHost}/statuses/${mockServerId}`);
  }
}
