import { chunk } from 'lodash';
import config from 'config';

const { dynamicLimiter } = config.sync;

const { exportLimit: EXPORT_LIMIT } = dynamicLimiter;

export const pushOutgoingChanges = async (centralServer, changes) => {
  const { sessionId } = await centralServer.startPushSession();
  const chunks = chunk(changes, EXPORT_LIMIT);
  for (const chunkOfChanges of chunks) {
    await centralServer.push(sessionId, chunkOfChanges);
  }

  // acknowledge that the final push has been completed, so the sync server can close the session
  // and persist the collection of records to be saved
  await centralServer.endPushSession(sessionId);
};
