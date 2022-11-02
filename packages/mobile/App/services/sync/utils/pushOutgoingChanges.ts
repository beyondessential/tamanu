import { SyncRecord } from '../types';

import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';

/**
 * Push outgoing changes in batches
 * @param centralServer
 * @param sessionId
 * @param changes
 * @param progressCallback
 */
export const pushOutgoingChanges = async (
  centralServer: CentralServerConnection,
  sessionId: number,
  changes: SyncRecord[],
  progressCallback: (total: number, progressCount: number) => void,
): Promise<void> => {
  let startOfPage = 0;
  let limit = calculatePageLimit();
  let pushedRecordsCount = 0;

  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);
    const startTime = Date.now();
    await centralServer.push(sessionId, page, endOfPage, changes.length);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
    pushedRecordsCount += page.length;

    progressCallback(changes.length, pushedRecordsCount);
  }
};
