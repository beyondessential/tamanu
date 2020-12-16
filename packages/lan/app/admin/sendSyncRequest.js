import config from 'config';
import fetch from 'node-fetch';

import { log } from '../logging';

const splitIntoChunks = (arr, chunkSize) => (new Array(Math.ceil(arr.length / chunkSize)))
  .fill(0)
  .map((v, i) => arr.slice(i * chunkSize, (i + 1) * chunkSize));

export async function sendSyncRequest(channel, records) {

  const maxRecordsPerRequest = 250;

  const parts = splitIntoChunks(records, maxRecordsPerRequest);
  log.info(`Syncing ${records.length} records (across ${parts.length} chunks) on ${channel} to ${config.syncHost}...`);

  const url = `${config.syncHost}/v1/sync/${channel}`;
  for(const part of parts) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': '1213',
      },
      body: JSON.stringify(part),
    });
    log.info(`Uploaded ${part.length} reference records. Response:`, await response.json());
  }
}
