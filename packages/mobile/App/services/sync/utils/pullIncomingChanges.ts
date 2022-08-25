import { SyncRecord } from '../types';
import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';

/**
 * Pull incoming changes in batches
 * @param centralServer
 * @param currentSessionIndex
 * @param lastSessionIndex
 * @param progressCallback
 * @returns
 */
export const pullIncomingChanges = async (
  centralServer: CentralServerConnection,
  currentSessionIndex: number,
  lastSessionIndex: number,
  progressCallback: (total: number, progressCount: number) => void,
): Promise<SyncRecord[]> => {
  const totalToPull = await centralServer.setPullFilter(currentSessionIndex, lastSessionIndex);

  let offset = 0;
  let limit = calculatePageLimit();
  const incomingChanges = [];

  // pull changes a page at a time
  while (incomingChanges.length < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(currentSessionIndex, limit, offset);

    incomingChanges.push(...records);
    offset += records.length;

    const pullTime = Date.now() - startTime;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, incomingChanges.length);
  }

  return incomingChanges;
};
