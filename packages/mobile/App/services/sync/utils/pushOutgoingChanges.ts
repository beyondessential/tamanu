import { SyncRecord, SyncRecordData } from '../types';

import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';

export const pushOutgoingChanges = async (
  centralServer: CentralServerConnection,
  sessionIndex: number,
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
    await centralServer.push(sessionIndex, page, endOfPage, changes.length);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
    pushedRecordsCount += page.length;

    progressCallback(changes.length, pushedRecordsCount);
  }
};
