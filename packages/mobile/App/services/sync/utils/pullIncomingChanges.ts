import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';

type PullIncomingChangesContext = {
  centralServer: CentralServerConnection;
  sessionId: string;
  recordTotal: number;
  progressCallback: (total: number, progressCount: number) => void;
};

export const pullRecordsInBatches = async (
  {
    centralServer,
    sessionId,
    recordTotal,
    progressCallback,
  }: PullIncomingChangesContext,
  processRecords: (
    records: any
  ) => Promise<void>,
) => {
  let fromId;
  let limit = calculatePageLimit();
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < recordTotal) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, fromId);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    await processRecords(recordsToSave);

    fromId = records[records.length - 1].id;
    totalPulled += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(recordTotal, totalPulled);
  }
};
