import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from './ScheduledTask';
import { serviceContext } from '../services/logging/context';

export class SendStatusToMetaServer extends ScheduledTask {
  constructor(context, serverType, overrideConfig = null) {
    const { schedule, jitterTime, enabled } =
      overrideConfig || config.schedules.sendStatusToMetaServer;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.serverType = serverType;
    this.metaserverHost = config.metaServer.host
  }

  async run() {
    const serverId = '00000000-0000-0000-0000-000000000000';
    const { version, serverType } = serviceContext()
    const response = await fetchWithTimeout(
      `${this.metaserverHost}/statuses/${serverId}/${version}`,
      {
        method,
        headers: {
          Accept: 'application/json',
          'X-Tamanu-Client': serverType,
          'X-Version': version,
          'Content-Type': body ? 'application/json' : undefined,
          ...headers,
        },
        body: JSON.stringify(body),
        timeout:
      }
  }
}
