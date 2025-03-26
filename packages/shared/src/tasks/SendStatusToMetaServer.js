import config from 'config';
import { Agent } from 'undici';

import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK, FACT_META_SERVER_ID } from '@tamanu/constants';

import { ScheduledTask } from './ScheduledTask';
import { serviceContext } from '../services/logging/context';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

// TODO put in @tamanu/database
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
    this.metaServerConfig = config.metaServer;
  }

  async fetch(url, options) {
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const deviceKey = await this.models.LocalSystemFact.getDeviceKey();
    const response = await fetchWithTimeout(`${this.metaServerConfig.host}/${url}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'X-Tamanu-Client': serverType,
        'X-Version': version,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: this.metaServerConfig.timeoutMs,
      dispatcher: new Agent({
        connect: {
          cert: deviceKey.makeCertificate(),
          key: deviceKey.toString()
        },
      }),
    });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch from meta server: ${response.statusText}`);
    }
    return response.json();
  }

  async getMetaServerId() {
    this.metaServerId = await this.models.LocalSystemFact.get(FACT_META_SERVER_ID);
    if (this.metaServerId) return this.metaServerId;
    const response = await this.fetch('server', {
      method: 'POST',
      body: JSON.stringify({
        host: config.canonicalHostName,
      }),
    });
    this.metaServerId = response.id;
    await this.models.LocalSystemFact.set(FACT_META_SERVER_ID, this.metaServerId);
    return this.metaServerId;
  }

  async run() {
    const currentSyncTick = await this.models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
    await this.fetch(`status/${await this.getMetaServerId()}`, {
      method: 'POST',
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.countryTimeZone,
      }),
      timeout: 20000,
    });
  }
}
