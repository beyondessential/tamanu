import { log } from 'shared/services/logging';
import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (centralServer, cursor = 0, patientId) => {
  const { sessionId, count: totalToPull } = await centralServer.startPullSession(cursor, {
    patientId,
  });
  let offset = 0;
  let limit = calculatePageLimit();
  const incomingChanges = [];
  log.debug(`pullIncomingChanges: syncing`, { sessionId, offset });

  // pull changes a page at a time
  while (incomingChanges.length < totalToPull) {
    log.debug(`pullIncomingChanges: pulling records`, {
      sessionId,
      offset,
      limit,
    });
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, {
      offset,
      limit,
    });
    incomingChanges.push(...records);
    offset = offset + records.length;

    const pullTime = Date.now() - startTime;
    limit = calculatePageLimit(limit, pullTime);
  }

  // acknowledge that the final pull was received, so the sync server can close the session and wipe
  // the snapshot of records to be pulled
  await centralServer.endPullSession(sessionId);
  return incomingChanges;
};
