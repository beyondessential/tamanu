import { chunk } from 'lodash';

const { dynamicLimiter } = config.sync;

const { exportLimit: EXPORT_LIMIT } = dynamicLimiter;

export const pushOutgoingChanges = async (remote, changes, setSyncCursor) => {
  const chunks = chunk(changes, EXPORT_LIMIT);
  for (const chunkOfChanges of chunks) {
    await remote.push(chunkOfChanges);
    const highestChange = chunkOfChanges[chunkOfChanges.length - 1];
    await setSyncCursor(highestChange.timestamp);
  }
};
