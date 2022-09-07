import { log } from 'shared/services/logging';
import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (centralServer, sessionId, since) => {
  const totalToPull = await centralServer.setPullFilter(sessionId, since);

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
    offset += records.length;

    const pullTime = Date.now() - startTime;
    limit = calculatePageLimit(limit, pullTime);
  }

  return incomingChanges;
};
