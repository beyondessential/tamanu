import config from 'config';
import { QueryTypes } from 'sequelize'
import { Agent, fetch } from 'undici';

import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK, FACT_META_SERVER_ID } from '@tamanu/constants';

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
    this.sequelize = context.store.sequelize;
    this.metaServerConfig = config.metaServer;
  }

  async fetch(path, options) {
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const deviceKey = await this.models.LocalSystemFact.getDeviceKey();
    const response = await fetch(`${this.metaServerConfig.host}/${path}`, {
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
          key: deviceKey.privateKeyPem()
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
    const response = await this.fetch('servers', {
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
    const versionQueryResult = await this.sequelize.query(`SELECT version()`, {
      type: QueryTypes.SELECT
    })
    const metaServerId = await this.getMetaServerId();
    await this.fetch(`status/${metaServerId}`, {
      method: 'POST',
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.countryTimeZone,
        version: versionQueryResult[0].version,
      }),
    });
  }
}
