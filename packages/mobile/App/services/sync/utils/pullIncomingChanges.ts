import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { createSnapshotTable, insertSnapshotRecords } from './manageSnapshotTable';
import { Database } from '~/infra/db';

/**
 * Pull incoming changes in batches and save them in sync_session_records table,
 * which will be used to persist to actual tables later
 * @param centralServer
 * @param sessionId
 * @param since
 * @param progressCallback
 * @returns
 */
export const pullIncomingChanges = async (
  centralServer: CentralServerConnection,
  sessionId: string,
  since: number,
  tableNames: string[],
  tablesForFullResync: string[],
  progressCallback: (total: number, progressCount: number) => void,
): Promise<{ totalPulled: number; pullUntil: number }> => {
  const queryRunner = Database.client.createQueryRunner();
  await createSnapshotTable(queryRunner, sessionId);

  const { totalToPull, pullUntil } = await centralServer.initiatePull(
    sessionId,
    since,
    tableNames,
    tablesForFullResync,
  );

  if (!totalToPull) {
    return { totalPulled: 0, pullUntil };
  }

  let fromId;
  let limit = calculatePageLimit();
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, fromId);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // Store the data in snapshot tables instead of files to avoid memory issues
    // during first sync or when large amounts of data need to be synced
    await insertSnapshotRecords(queryRunner, sessionId, recordsToSave);

    fromId = records[records.length - 1].id;
    totalPulled += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, totalPulled);
  }

  return { totalPulled: totalToPull, pullUntil };
};
