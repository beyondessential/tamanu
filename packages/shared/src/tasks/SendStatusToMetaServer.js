import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK,FACT_META_SERVER_ID } from '@tamanu/constants';
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

  async fetch(url, options) {
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const response = await fetchWithTimeout(`${this.metaserverHost}/${url}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'X-Tamanu-Client': serverType,
        'X-Version': version,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch from meta server: ${response.statusText}`);
    }
    return response.json();
  }

  async getMetaServerId() {
    this.metaServerId = await this.models.LocalSystemFact.get(FACT_META_SERVER_ID);
    if (!this.metaServerId) {
      const response = await this.fetch('server', {
        method: 'POST',
        timeout: 20000,
      });
      this.metaServerId = response.id;
      await this.models.LocalSystemFact.set(FACT_META_SERVER_ID, this.metaServerId);
    }
    return this.metaServerId;
  }

  async run() {
    const currentSyncTick = await this.models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
    const metaServerId = this.metaServerId || await this.getMetaServerId()

    await this.fetch(`status/${metaServerId}`, {
      method: 'POST',
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.countryTimeZone,
      }),
      timeout: 20000,
    });
  }
}
