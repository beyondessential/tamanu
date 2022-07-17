import { log } from 'shared/services/logging';
import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (
  centralServer,
  sessionIndex,
  lastSessionIndex,
  patientId,
) => {
  const totalToPull = await centralServer.setPullFilter(sessionIndex, lastSessionIndex, {
    patientId,
  });

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

  // make sure no incoming record is marked as being updated more recently than the current session,
  // which could happen if another facility synced to the central server between this facility
  // pushing and pulling - if that happened and we left it, we would echo the change back to the
  // central server next sync
  const capUpdatedSinceToCurrentSession = c => ({
    ...c,
    data: {
      ...c.data,
      updatedSinceSession: Math.min(c.data.updatedSinceSession, sessionIndex - 1),
    },
  });
  return incomingChanges.map(capUpdatedSinceToCurrentSession);
};
