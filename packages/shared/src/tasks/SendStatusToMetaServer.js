import config from 'config';
import path from 'node:path';
import os from 'node:os'
import { QueryTypes } from 'sequelize';
import { Agent, fetch } from 'undici';

import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK, FACT_META_SERVER_ID } from '@tamanu/constants';

import { ScheduledTask } from './ScheduledTask';
import { serviceContext } from '../services/logging/context';

export class SendStatusToMetaServer extends ScheduledTask {
  getName() {
    return 'SendStatusToMetaServer';
  }
  constructor(context, overrideConfig = null) {
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const randomJitterMs = Math.random() * 5000; // 0-5000ms
    const { schedule, jitterTime = randomJitterMs, enabled } =
      overrideConfig || config.schedules.sendStatusToMetaServer;

    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.models || context.store.models;
    this.sequelize = context.sequelize || context.store.sequelize;
    this.serverType = serverType;
    this.version = version;
  }

  async fetch(path, options) {
    const deviceKey = await this.models.LocalSystemFact.getDeviceKey();
    const response = await fetch(`${config.metaServer.host}/${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'X-Tamanu-Client': this.serverType,
        'X-Version': this.version,
        'Content-Type': 'application/json',
        'User-Agent': `Tamanu/${this.version} Node.js/${process.version.replace(/^v/, '')}`,
        ...options.headers,
      },
      timeout: config.metaServer.timeoutMs,
      dispatcher: new Agent({
        connect: {
          cert: deviceKey.makeCertificate(),
          key: deviceKey.privateKeyPem(),
        },
      }),
    });
    if (response.status === 403) {
      log.info(`Post of server to meta server unauthorised:\n${deviceKey.publicKeyPem()}`)
    }
    if (response.status !== 200) {
      throw new Error(`Failed to fetch from meta server: ${response.statusText}`);
    }
    return response.json();
  }

  async getMetaServerId() {
    this.metaServerId = await this.models.LocalSystemFact.get(FACT_META_SERVER_ID);
    if (this.metaServerId) return this.metaServerId;
    console.log( path.join('http://', os.hostname()))
    this.metaServerId =
      config.metaServer.serverId ||
      (
        await this.fetch('servers', {
          method: 'POST',
          body: JSON.stringify({
            host: config.canonicalHostName || path.join('http://', os.hostname()),
            kind: this.serverType,
          }),
        })
      )?.id;
    await this.models.LocalSystemFact.set(FACT_META_SERVER_ID, this.metaServerId);
    return this.metaServerId;
  }

  async run() {
    const currentSyncTick = await this.models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
    const pgVersionResult = await this.sequelize.query(`SELECT version()`, {
      type: QueryTypes.SELECT,
    });
    const metaServerId = await this.getMetaServerId();
    await this.fetch(`status/${metaServerId}`, {
      method: 'POST',
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.countryTimeZone,
        pgVersion: pgVersionResult[0].version,
      }),
    });
  }
}
