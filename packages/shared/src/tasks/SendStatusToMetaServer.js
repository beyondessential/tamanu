import config from 'config';
import path from 'node:path';
import os from 'node:os'
import { QueryTypes } from 'sequelize';
import { Agent, fetch } from 'undici';

import { log } from '@tamanu/shared/services/logging';
import { FACT_CURRENT_SYNC_TICK, FACT_META_SERVER_ID } from '@tamanu/constants';

import { ScheduledTask } from './ScheduledTask';
import { serviceContext } from '../services/logging/context';
import { getMetaServerHosts } from '../utils';

export class SendStatusToMetaServer extends ScheduledTask {
  getName() {
    return 'SendStatusToMetaServer';
  }
  constructor(context, overrideConfig = null) {
    const { 'service.type': serverType, 'service.version': version } = serviceContext();
    const { schedule, jitterTime, enabled } =
      overrideConfig || config.schedules.sendStatusToMetaServer;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.models || context.store.models;
    this.sequelize = context.sequelize || context.store.sequelize;
    this.serverType = serverType;
    this.version = version;
  }

  async fetch(host, deviceKey, path, options) {
    const response = await fetch(`${host}/${path}`, {
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

  async fetchFromHosts(path, options) {
    const metaServerHosts = getMetaServerHosts();

    const deviceKey = await this.models.LocalSystemFact.getDeviceKey();
    for (const metaServerHost of metaServerHosts) {
      try {
        const response = await this.fetch(metaServerHost, deviceKey, path, options);
        return response;
      } catch (error) {
        log.error(`Failed to fetch from meta server host: ${metaServerHost}`, { error });
      }
    }
    throw new Error('No meta server host succeeded fetching the data');
  }

  async getMetaServerId() {
    this.metaServerId = await this.models.LocalSystemFact.get(FACT_META_SERVER_ID);
    if (this.metaServerId) return this.metaServerId;
    this.metaServerId =
      config.metaServer.serverId ||
      (
        await this.fetchFromHosts('servers', {
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
    await this.fetchFromHosts(`status/${metaServerId}`, {
      method: 'POST',
      body: JSON.stringify({
        currentSyncTick,
        timezone: config.globalTimeZone,
        pgVersion: pgVersionResult[0].version,
      }),
    });
  }
}
