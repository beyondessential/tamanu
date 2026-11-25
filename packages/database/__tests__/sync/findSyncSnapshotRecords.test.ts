import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { closeDatabase, createTestDatabase } from '../utilities';
import {
  createSnapshotTable,
  dropSnapshotTable,
  findSyncSnapshotRecordsOrderByDependency,
  getModelsForPull,
  getSnapshotTableName,
} from '../../src/sync';
import { SYNC_SESSION_DIRECTION } from '../../src/sync/constants';
import { sortInDependencyOrder } from '../../src/utils/sortInDependencyOrder';

const { INCOMING, OUTGOING } = SYNC_SESSION_DIRECTION;

const toCursor = ({ sortOrder, id }) => btoa(JSON.stringify({ sortOrder, id }));

describe('findSyncSnapshotRecordsOrderByDependency', () => {
  let store;
  let sessionId;
  let recordTypes; // [first, middle, last] in dependency order, with their sort orders

  const insertSnapshotRecord = async (recordType: string, direction = OUTGOING) => {
    const [[{ id }]] = await store.sequelize.query(
      `INSERT INTO ${getSnapshotTableName(sessionId)}
        (direction, record_type, record_id, is_deleted, data)
        VALUES (:direction, :recordType, :recordId, false, '{}')
        RETURNING id`,
      { replacements: { direction, recordType, recordId: randomUUID() } },
    );
    return id;
  };

  const find = (fromId?: string, limit?: number, additionalWhere?: string) =>
    findSyncSnapshotRecordsOrderByDependency(
      store,
      sessionId,
      OUTGOING,
      fromId,
      limit,
      additionalWhere,
    );

  beforeAll(async () => {
    store = await createTestDatabase();
    const sortedModels = sortInDependencyOrder(getModelsForPull(store.models));
    recordTypes = [0, Math.floor(sortedModels.length / 2), sortedModels.length - 1].map(
      index => ({ recordType: sortedModels[index].tableName, sortOrder: index + 1 }),
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    sessionId = randomUUID();
    await createSnapshotTable(store.sequelize, sessionId);

    // Insert in reverse dependency order, so id order disagrees with dependency order
    const [first, middle, last] = recordTypes;
    for (const { recordType } of [last, middle, first, last, middle, first]) {
      await insertSnapshotRecord(recordType);
    }
    await insertSnapshotRecord(middle.recordType, INCOMING);
  });

  afterEach(async () => {
    await dropSnapshotTable(store.sequelize, sessionId);
  });

  it('returns outgoing records ordered by dependency, then id', async () => {
    const records = await find();

    expect(records.map(r => [r.recordType, Number(r.sortOrder)])).toEqual(
      recordTypes.flatMap(({ recordType, sortOrder }) => [
        [recordType, sortOrder],
        [recordType, sortOrder],
      ]),
    );
    expect(records.every(r => r.direction === OUTGOING)).toBe(true);
    for (const [index, record] of records.entries()) {
      const next = records[index + 1];
      if (next?.recordType === record.recordType) {
        expect(Number(next.id)).toBeGreaterThan(Number(record.id));
      }
    }
  });

  it.each([1, 2, 3, 4, 5])(
    'pages with limit %i return the same records as a single fetch',
    async limit => {
      const allRecords = await find();

      const pagedRecords = [];
      let fromId: string | undefined;
      for (;;) {
        const page = await find(fromId, limit);
        if (!page.length) break;
        expect(page.length).toBeLessThanOrEqual(limit);
        pagedRecords.push(...page);
        fromId = toCursor(page.at(-1));
      }

      expect(pagedRecords.map(r => r.id)).toEqual(allRecords.map(r => r.id));
    },
  );

  it('resumes after the cursor within the same record type', async () => {
    const firstPage = await find(undefined, 1);
    const rest = await find(toCursor(firstPage[0]));

    const allRecords = await find();
    expect(rest.map(r => r.id)).toEqual(allRecords.slice(1).map(r => r.id));
  });

  it('applies additionalWhere to every record type', async () => {
    const [, middle] = recordTypes;
    const records = await find(undefined, undefined, `record_type = '${middle.recordType}'`);

    expect(records).toHaveLength(2);
    expect(records.every(r => r.recordType === middle.recordType)).toBe(true);
  });

  it('returns nothing once the cursor is past the last record', async () => {
    const allRecords = await find();
    expect(await find(toCursor(allRecords.at(-1)))).toEqual([]);
  });
});
