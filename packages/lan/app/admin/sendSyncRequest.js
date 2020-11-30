import config from 'config';
import fetch from 'node-fetch';

import { log } from '../logging';

export async function sendSyncRequest(channel, records) {
  log.info(`Syncing ${records.length} records on ${channel} to ${config.syncHost}...`);

  const url = `${config.syncHost}/v1/sync/${channel}`;
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': '1213',
    },
    body: JSON.stringify(records),
  });
}
