import config from 'config';
import { chunk } from 'es-toolkit/compat';
import { log } from '@tamanu/shared/services/logging';
import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import {
  encodeSnapshotCursor,
  insertSnapshotRecords,
  SYNC_SESSION_DIRECTION,
  SYNC_TICK_FLAGS,
} from '@tamanu/database/sync';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { calculatePageLimit } from './calculatePageLimit';

const { persistedCacheBatchSize, pauseBetweenCacheBatchInMilliseconds } = config.sync;

// sortOrder comes from the dependency ordering central pages by; it belongs to the cursor, not to
// the snapshot table, which has no such column.
//
// Must not mutate the record it is given: the streaming path holds the same objects in both its
// write batch and its resume cursor, so dropping sortOrder in place would blank the cursor and
// restart the stream from the beginning of the snapshot. Removing the key by destructuring rather
// than `delete` also keeps the object out of dictionary mode, so the spread below stays cheap —
// this runs once per pulled record.
// eslint-disable-next-line no-unused-vars
const toSnapshotRecord = ({ sortOrder, ...record }) => ({
  ...record,
  // mark as never updated, so we don't push it back to the central server until the next local update
  data: { ...record.data, updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER },
  direction: SYNC_SESSION_DIRECTION.INCOMING,
});

export const pullIncomingChanges = async (centralServer, sequelize, sessionId, since) => {
  const start = Date.now();

  // initiating pull also returns the sync tick (or point on the sync timeline) that the
  // central server considers this session will be up to after pulling all changes
  log.info('FacilitySyncManager.pull.waitingForCentral', { mode: 'polling' });
  const { totalToPull, pullUntil } = await centralServer.initiatePull(sessionId, since);

  log.info('FacilitySyncManager.pulling', { since, totalToPull });
  let fromId;
  let limit = calculatePageLimit();
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    log.debug('FacilitySyncManager.pull.pullingPage', {
      fromId,
      limit,
    });
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, {
      fromId,
      limit,
    });
    if (!records.length) {
      log.debug(`FacilitySyncManager.pull.noMoreChanges`);
      break;
    }

    fromId = encodeSnapshotCursor(records[records.length - 1]);
    totalPulled += records.length;
    const pullTime = Date.now() - startTime;

    log.info('FacilitySyncManager.savingChangesToSnapshot', { count: records.length });

    const recordsToSave = records.map(toSnapshotRecord);

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in a sync snapshot table instead and will persist it to the actual tables later
    for (const batchOfRows of chunk(recordsToSave, persistedCacheBatchSize)) {
      await insertSnapshotRecords(sequelize, sessionId, batchOfRows);

      await sleepAsync(pauseBetweenCacheBatchInMilliseconds);
    }

    limit = calculatePageLimit(limit, pullTime);
  }

  log.info('FacilitySyncManager.pulled', { durationMs: Date.now() - start });
  return { totalPulled: totalToPull, pullUntil };
};

export const streamIncomingChanges = async (centralServer, sequelize, sessionId, since) => {
  const start = Date.now();

  // initiating pull also returns the sync tick (or point on the sync timeline) that the
  // central server considers this session will be up to after pulling all changes
  log.info('FacilitySyncManager.pull.waitingForCentral', { mode: 'streaming' });
  const { totalToPull, pullUntil } = await centralServer.initiatePull(sessionId, since);
  const WRITE_BATCH_SIZE = Math.min(persistedCacheBatchSize, totalToPull);

  const writeBatch = async records => {
    if (records.length === 0) return;
    await insertSnapshotRecords(sequelize, sessionId, records.map(toSnapshotRecord));
  };

  log.info('FacilitySyncManager.pulling', { since, totalToPull });
  let totalPulled = 0; // statistics
  let records = []; // for batching writes
  let writes = []; // ongoing write promises

  // keep track of the record we're on so we can resume the stream on disconnect from where we left
  // off rather than the start. Only the last one is ever encoded, on the reconnect that needs it,
  // rather than once per record streamed.
  //
  // This is the same object that goes into the write batch below, and its sortOrder is half of the
  // cursor, so whatever the batch does to a record on its way to the snapshot table has to leave the
  // record itself alone — see toSnapshotRecord
  let lastRecord;
  const endpointFn = () => ({
    endpoint: `sync/${sessionId}/pull/stream`,
    query: { fromId: lastRecord && encodeSnapshotCursor(lastRecord) },
  });

  stream: for await (const { kind, message } of centralServer.stream(endpointFn)) {
    if (records.length >= WRITE_BATCH_SIZE) {
      // do writes in the background while we're continuing to stream data
      writes.push(writeBatch(records));
      records = [];
    }

    handler: switch (kind) {
      case SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE:
        records.push(message);
        totalPulled += 1;
        lastRecord = message;
        break handler;
      case SYNC_STREAM_MESSAGE_KIND.END:
        log.debug(`FacilitySyncManager.pull.noMoreChanges`);
        break stream;
      default:
        log.warn('FacilitySyncManager.pull.unknownMessageKind', { kind });
    }
  }

  if (records.length > 0) {
    writes.push(writeBatch(records));
  }

  await Promise.all(writes);

  log.info('FacilitySyncManager.pulled', { durationMs: Date.now() - start });
  return { totalPulled, totalToPull, pullUntil };
};
