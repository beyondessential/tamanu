import config from 'config';

import { log } from 'shared/services/logging';

const splitIntoChunks = (arr, chunkSize) =>
  new Array(Math.ceil(arr.length / chunkSize))
    .fill(0)
    .map((v, i) => arr.slice(i * chunkSize, (i + 1) * chunkSize));

export async function sendSyncRequest(remote, channel, records) {
  // use a much lower # of requests per channel for users, as it can contain
  // a call to bcrypt, which is intentionally slow, and this can time syncs out
  const maxRecordsPerRequest = channel === 'user' ? 3 : 250;

  const parts = splitIntoChunks(records, maxRecordsPerRequest);
  log.info(
    `Syncing ${records.length} records (across ${parts.length} chunks) on ${channel} to ${config.sync.host}...`,
  );

  const url = `sync/${encodeURIComponent(channel)}`;
  for (const part of parts) {
    const response = await remote.fetch(url, {
      method: 'POST',
      body: part,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    log.info(`Uploaded ${part.length} reference records. Response:`, response);
  }
}
