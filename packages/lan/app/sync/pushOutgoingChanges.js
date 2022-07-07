import { chunk } from 'lodash';

const { dynamicLimiter } = config.sync;

const { exportLimit: EXPORT_LIMIT } = dynamicLimiter;

export const pushOutgoingChanges = async (remote, changes) => {
  const sessionId = await remote.startPushSession();
  const chunks = chunk(changes, EXPORT_LIMIT);
  for (const chunkOfChanges of chunks) {
    await remote.push(sessionid, chunkOfChanges);
  }

  // acknowledge that the final push has been completed, so the sync server can close the session
  // and persist the collection of records to be saved
  await remote.endSession(sessionId);
};
