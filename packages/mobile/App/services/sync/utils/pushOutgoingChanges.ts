import type { SyncRecord } from '../types';
import type { MODELS_MAP } from '../../../models/modelsMap';

import type { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import type { MobileSyncSettings } from '../MobileSyncManager';
import { timeSuccessfulAttempt } from './timeSuccessfulAttempt';

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
  const { dynamicLimiter: dynamicLimiterSettings } = syncSettings ?? {};
  let startOfPage = 0;
  let limit = calculatePageLimit(dynamicLimiterSettings);
  let pushedRecordsCount = 0;

  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);
    const { durationMs: pushTime } = await timeSuccessfulAttempt(onAttempt =>
      centralServer.push(sessionId, page, onAttempt),
    );

    startOfPage = endOfPage;
    limit = calculatePageLimit(dynamicLimiterSettings, limit, pushTime);
    pushedRecordsCount += page.length;

    progressCallback(changes.length, pushedRecordsCount);
  }
  await centralServer.completePush(
    sessionId,
    Object.values(outgoingModels).map(m => m.getTableName()),
  );
};
