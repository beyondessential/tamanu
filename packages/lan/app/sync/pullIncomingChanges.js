import { log } from 'shared/services/logging';
import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (centralServer, sessionIndex, lastSessionIndex) => {
  const totalToPull = await centralServer.setPullFilter(sessionIndex, lastSessionIndex);

  let offset = 0;
  let limit = calculatePageLimit();
  const incomingChanges = [];
  log.debug(`pullIncomingChanges: syncing`, { sessionIndex, offset });

  // pull changes a page at a time
  while (incomingChanges.length < totalToPull) {
    log.debug(`pullIncomingChanges: pulling records`, {
      sessionIndex,
      offset,
      limit,
    });
    const startTime = Date.now();
    const records = await centralServer.pull(sessionIndex, {
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
