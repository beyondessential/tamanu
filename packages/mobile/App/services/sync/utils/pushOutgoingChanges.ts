import { SyncRecord } from '../types';
import { MODELS_MAP } from '../../../models/modelsMap';

import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { MobileSyncSettings } from '../MobileSyncManager';

/**
 * Push outgoing changes in batches
 * @param centralServer
 * @param sessionId
 * @param changes
 * @param progressCallback
 */
export const pushOutgoingChanges = async (
  centralServer: CentralServerConnection,
  outgoingModels: Partial<typeof MODELS_MAP>,
  sessionId: string,
  changes: SyncRecord[],
  syncSettings: MobileSyncSettings,
  progressCallback: (total: number, progressCount: number) => void,
): Promise<void> => {
  const { dynamicLimiter: dynamicLimiterSettings } = syncSettings || {};
  let startOfPage = 0;
  let limit = calculatePageLimit(dynamicLimiterSettings);
  let pushedRecordsCount = 0;

  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);
    const startTime = Date.now();
    await centralServer.push(sessionId, page);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(dynamicLimiterSettings, limit, endTime - startTime);
    pushedRecordsCount += page.length;

    progressCallback(changes.length, pushedRecordsCount);
  }
  await centralServer.completePush(
    sessionId,
    Object.values(outgoingModels).map(m => m.getTableName()),
  );
};
