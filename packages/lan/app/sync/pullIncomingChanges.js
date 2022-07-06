import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (remote, getCursor, patientId) => {
  const cursor = await getCursor();
  const { sessionId, totalToPull } = await remote.startPullSession(cursor, { patientId });
  let offset = 0;
  let limit = calculatePageLimit();
  const incomingChanges = [];
  log.debug(`SyncManager.pullChanges: syncing`, { sessionId, offset });

  // pull changes a page at a time
  while (incomingChanges.length < totalToPull) {
    log.debug(`SyncManager.pullChanges: pulling records`, {
      sessionId,
      offset,
      limit,
    });
    const startTime = Date.now();
    const records = await remote.pull(sessionId, {
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
  await remote.endPullSession(sessionId);
  return incomingChanges;
};
