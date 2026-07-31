import { describe, expect, it, jest } from '@jest/globals';

import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import { encodeSnapshotCursor } from '@tamanu/database/sync';

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
});
