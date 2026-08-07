import { describe, expect, it, jest } from '@jest/globals';

import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import { encodeSnapshotCursor } from '@tamanu/database/sync';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { pullIncomingChanges, streamIncomingChanges } from '../../app/sync/pullIncomingChanges';

const fakeChange = ({ id, sortOrder, recordType }) => ({
  id,
  sortOrder,
  recordType,
  recordId: `record-${id}`,
  isDeleted: false,
  data: { id: `record-${id}` },
});

// stands in for a snapshot table, so we can see what would be inserted into it
const fakeSequelize = bulkInsert => ({ getQueryInterface: () => ({ bulkInsert }) });

describe('pullIncomingChanges', () => {
  it('completes cleanly when the central server returns an empty page', async () => {
    // central server reports records to pull, but the pull query returns an empty page
    // (reachable when totalToPull diverges from the dependency-ordered pull query)
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 10, pullUntil: 42 }),
      pull: jest.fn().mockResolvedValue([]),
    };
    const sequelize = {};

    const result = await pullIncomingChanges(centralServer, sequelize, 'sessionId', 1);

    expect(centralServer.pull).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalPulled: 10, pullUntil: 42 });
  });

  it('pages from the last record of the previous page, on both cursor parts', async () => {
    const page = [
      fakeChange({ id: '1', sortOrder: 1, recordType: 'facilities' }),
      fakeChange({ id: '2', sortOrder: 4, recordType: 'users' }),
    ];
    const centralServer = {
      // more to pull than the page returns, so a second page is requested
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 3, pullUntil: 42 }),
      pull: jest.fn().mockResolvedValueOnce(page).mockResolvedValue([]),
    };

    await pullIncomingChanges(centralServer, fakeSequelize(jest.fn()), 'sessionId', 1);

    expect(centralServer.pull).toHaveBeenNthCalledWith(
      2,
      'sessionId',
      expect.objectContaining({ fromId: encodeSnapshotCursor({ sortOrder: 4, id: '2' }) }),
    );
  });

  it('keeps sortOrder out of the snapshot table', async () => {
    const bulkInsert = jest.fn();
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      pull: jest
        .fn()
        .mockResolvedValueOnce([fakeChange({ id: '1', sortOrder: 1, recordType: 'facilities' })]),
    };

    await pullIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1);

    const [, insertedRows] = bulkInsert.mock.calls[0];
    expect(insertedRows[0]).not.toHaveProperty('sort_order');
    expect(insertedRows[0]).toHaveProperty('record_id', 'record-1');
  });
});

describe('streamIncomingChanges', () => {
  const streamOf = (changes, captureResume) =>
    async function* stream(endpointFn) {
      for (const change of changes) {
        yield { kind: SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE, message: change };
      }
      captureResume(endpointFn().query);
      yield { kind: SYNC_STREAM_MESSAGE_KIND.END };
    };

  it('resumes from the last streamed record, on both cursor parts', async () => {
    const change = fakeChange({ id: '7', sortOrder: 2, recordType: 'users' });
    let resumeQuery;
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      stream: streamOf([change], query => {
        resumeQuery = query;
      }),
    };

    await streamIncomingChanges(centralServer, fakeSequelize(jest.fn()), 'sessionId', 1);

    expect(resumeQuery.fromId).toBe(encodeSnapshotCursor(change));
  });

  it('keeps sortOrder out of the snapshot table', async () => {
    const bulkInsert = jest.fn();
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      stream: streamOf([fakeChange({ id: '7', sortOrder: 2, recordType: 'users' })], () => {}),
    };

    await streamIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1);

    const [, insertedRows] = bulkInsert.mock.calls[0];
    expect(insertedRows[0]).not.toHaveProperty('sort_order');
    expect(insertedRows[0]).toHaveProperty('record_id', 'record-7');
  });

  it('leaves the streamed records intact, so a write cannot blank the resume cursor', async () => {
    // the streamed records are the cursor: writing a batch must not take sortOrder off them, or a
    // reconnect after that write resumes from a cursor missing half its key and restarts the pull
    // from the beginning of the snapshot. totalToPull of 1 caps the write batch at one record, so
    // the first record is written while the second is still streaming.
    const changes = [
      fakeChange({ id: '7', sortOrder: 2, recordType: 'users' }),
      fakeChange({ id: '8', sortOrder: 2, recordType: 'users' }),
    ];
    const bulkInsert = jest.fn();
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      stream: streamOf(changes, () => {}),
    };

    await streamIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1);

    expect(bulkInsert).toHaveBeenCalled();
    expect(changes).toEqual([
      expect.objectContaining({ id: '7', sortOrder: 2 }),
      expect.objectContaining({ id: '8', sortOrder: 2 }),
    ]);
  });

  // a totalToPull of 1 caps the write batch at one record, so each streamed record below is its own
  // insert — enough batches to see how the writes are paced
  const streamOfRecordPerBatch = count =>
    streamOf(
      Array.from({ length: count }, (_, index) =>
        fakeChange({ id: String(index), sortOrder: 1, recordType: 'users' }),
      ),
      () => {},
    );

  it('keeps at most one snapshot insert in flight', async () => {
    let inFlight = 0;
    let mostInFlight = 0;
    const bulkInsert = jest.fn(async () => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      await sleepAsync(5);
      inFlight -= 1;
    });
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      stream: streamOfRecordPerBatch(5),
    };

    await streamIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1);

    // every batch still gets written, they just don't pile onto the connection pool at once
    expect(bulkInsert).toHaveBeenCalledTimes(5);
    expect(mostInFlight).toBe(1);
  });

  it('fails the pull on a failed insert rather than streaming on to the end', async () => {
    const bulkInsert = jest.fn().mockRejectedValue(new Error('snapshot table is gone'));
    const stream = streamOfRecordPerBatch(20);
    let streamed = 0;
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
      stream: async function* countingStream(endpointFn) {
        for await (const message of stream(endpointFn)) {
          streamed += 1;
          yield message;
        }
      },
    };

    await expect(
      streamIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1),
    ).rejects.toThrow('snapshot table is gone');
    expect(streamed).toBeLessThan(20);
  });

  it('settles the in-flight insert when the stream fails, and reports the stream failure', async () => {
    const unhandled = [];
    const collectUnhandled = reason => unhandled.push(reason);
    process.on('unhandledRejection', collectUnhandled);

    try {
      const bulkInsert = jest.fn(async () => {
        // fails after the stream does, so nothing is waiting on it by then
        await sleepAsync(5);
        throw new Error('insert failed too');
      });
      const centralServer = {
        initiatePull: jest.fn().mockResolvedValue({ totalToPull: 1, pullUntil: 42 }),
        stream: async function* failingStream() {
          yield {
            kind: SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE,
            message: fakeChange({ id: '1', sortOrder: 1, recordType: 'users' }),
          };
          yield {
            kind: SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE,
            message: fakeChange({ id: '2', sortOrder: 1, recordType: 'users' }),
          };
          throw new Error('stream disconnected');
        },
      };

      await expect(
        streamIncomingChanges(centralServer, fakeSequelize(bulkInsert), 'sessionId', 1),
      ).rejects.toThrow('stream disconnected');

      // let the insert reject, and node notice if nothing observed it
      await sleepAsync(30);
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', collectUnhandled);
    }
  });
});
