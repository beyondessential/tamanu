import { SyncRecord } from '../types';
import { SYNC_DIRECTIONS } from '../../../models/types';
import { MODELS_MAP } from '../../../models/modelsMap';

import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { getModelsForDirection } from './getModelsForDirection';

/**
 * Push outgoing changes in batches
 * @param centralServer
 * @param sessionId
 * @param changes
 * @param progressCallback
 */
export const pushOutgoingChanges = async (
  centralServer: CentralServerConnection,
  outgoingModels: typeof MODELS_MAP,
  sessionId: string,
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
    await centralServer.push(
      sessionId,
      page,
      endOfPage,
      changes.length,
      Object.values(outgoingModels).map(m => m.getTableNameForSync()),
    );
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
    pushedRecordsCount += page.length;

    progressCallback(changes.length, pushedRecordsCount);
  }
};
