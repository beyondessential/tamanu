import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { CentralServerConnection } from '../CentralServerConnection';
import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';

type PullRecordsInBatchesParams = {
  centralServer: CentralServerConnection;
  sessionId: string;
  recordTotal: number;
  progressCallback?: (incrementalPulled: number) => void;
};

export const pullRecordsInBatches = async (
  { centralServer, sessionId, recordTotal, progressCallback = () => {} }: PullRecordsInBatchesParams,
  processRecords: (records: any) => Promise<void>,
) => {
  let fromId;
  let limit = calculatePageLimit();
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < recordTotal) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, { limit, fromId });
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    await processRecords(recordsToSave);

    const { id, sortOrder } = records[records.length - 1];
    fromId = btoa(JSON.stringify({ sortOrder, id }));
    totalPulled += records.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(recordsToSave.length);
  }
};

export const streamRecordsInBatches = async (
  params: PullRecordsInBatchesParams,
  processRecords: (records: any) => Promise<void>,
) => {
  const { centralServer, sessionId, progressCallback = () => {} } = params;
  let records = [];
  const writes = [];
  let fromId;

  const writeBatch = async (recordsToWrite: any[]) => {
    if (recordsToWrite.length === 0) return;
    await processRecords(recordsToWrite);
  };

  // keep track of the ID we're on so we can resume the stream
  // on disconnect from where we left off rather than the start
  const endpointFn = () => ({
    endpoint: `sync/${sessionId}/pull/stream`,
    query: { fromId },
  });

  stream: for await (const { kind, message } of centralServer.stream(endpointFn)) {
    if (records.length >= 100) {
      // do writes in the background while we're continuing to stream data
      writes.push(writeBatch(records));
      records = [];
    }

    handler: switch (kind) {
      case SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE:
        records.push({
          ...message,
          // mark as never updated, so we don't push it back to the central server until the next update
          data: { ...message.data, updated_at_sync_tick: -1 },
          direction: SYNC_SESSION_DIRECTION.INCOMING,
        });
        fromId = btoa(JSON.stringify({ sortOrder: message.sortOrder, id: message.id }));
        progressCallback(1);
        break handler;
      case SYNC_STREAM_MESSAGE_KIND.END:
        console.debug('MobileSyncManager.pull.noMoreChanges');
        break stream;
      default:
        console.warn('MobileSyncManager.pull.unknownMessageKind', { kind });
    }
  }

  if (records.length > 0) {
    writes.push(writeBatch(records));
  }

  await Promise.all(writes);
};
