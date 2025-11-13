import { beforeAll, describe, expect, it } from '@jest/globals';

import { withErrorShown } from '@tamanu/shared/test-helpers';
import { fakeReferenceData } from '@tamanu/fake-data/fake';
import { getModelsForPush, SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    outgoingModels = getModelsForPush(models);
  });

  afterAll(() => ctx.close());

  it(
    'if nothing changed returns empty array',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tick = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);

      const result = await snapshotOutgoingChanges(ctx.sequelize, outgoingModels, tick - 1);
      expect(result).toEqual([]);
    }),
  );

  it(
    'throws error when outgoing models contain invalid sync direction',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tick = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);

      await expect(snapshotOutgoingChanges(ctx.sequelize, models, tick - 1)).rejects.toThrowError();
    }),
  );

  it(
    'returns serialised records (excluding metadata columns)',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;
      const tick = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);

      const row = await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(ctx.sequelize, outgoingModels, tick - 1);

      expect(result).toEqual([
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'reference_data',
          recordId: row.id,
          data: {
            id: row.id,
            code: row.code,
            name: row.name,
            type: row.type,
            visibilityStatus: row.visibilityStatus,
            systemRequired: row.systemRequired,
          },
        },
      ]);
    }),
  );

  it(
    'returns records changed since given tick only',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const tickBefore = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      await ReferenceData.create(fakeReferenceData());

      await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      const row = await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(ctx.sequelize, outgoingModels, tickBefore);

      expect(result).toEqual([
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'reference_data',
          recordId: row.id,
          data: {
            id: row.id,
            code: row.code,
            name: row.name,
            type: row.type,
            visibilityStatus: row.visibilityStatus,
            systemRequired: row.systemRequired,
          },
        },
      ]);
    }),
  );

  it(
    'returns records changed since more than one tick',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const tickBefore = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      const rowBefore = await ReferenceData.create(fakeReferenceData());

      await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      const rowAfter = await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(ctx.sequelize, outgoingModels, tickBefore - 1);

      expect(result).toEqual([
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'reference_data',
          recordId: rowBefore.id,
          data: {
            id: rowBefore.id,
            code: rowBefore.code,
            name: rowBefore.name,
            type: rowBefore.type,
            visibilityStatus: rowBefore.visibilityStatus,
            systemRequired: rowBefore.systemRequired,
          },
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'reference_data',
          recordId: rowAfter.id,
          data: {
            id: rowAfter.id,
            code: rowAfter.code,
            name: rowAfter.name,
            type: rowAfter.type,
            visibilityStatus: rowAfter.visibilityStatus,
            systemRequired: rowAfter.systemRequired,
          },
        },
      ]);
    }),
  );

  it(
    'concurrent transaction commits AFTER snapshot commits',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const resolveWhenNonEmpty = [];
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        async findAll() {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            if (resolveWhenNonEmpty.length > 0) {
              return [];
            }

            await sleepAsync(5);
          }
        },
      };

      const tick = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      const rowBefore = await ReferenceData.create({
        ...fakeReferenceData(),
        name: 'refData before',
      });

      const snapshot = snapshotOutgoingChanges(
        ctx.sequelize,
        {
          // the transaction needs to have a select, ANY select, so the database
          // actually takes a snapshot of the db at that point in time. THEN we
          // can pause the transaction, and test the behaviour.
          ReportRequest: models.ReportRequest,
          FakeModel: fakeModelThatWaitsUntilWeSaySo,
          ReferenceData: models.ReferenceData,
        },
        tick - 1,
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.sequelize.transaction(async (transaction) => {
        await ReferenceData.create(
          {
            ...fakeReferenceData(),
            name: 'refData after',
          },
          {
            transaction,
          },
        );
        await sleepAsync(200);
      });
      await sleepAsync(20);

      // unblock snapshot
      resolveWhenNonEmpty.push(true);
      const result = await snapshot;

      expect(result).toEqual([
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'reference_data',
          recordId: rowBefore.id,
          data: {
            id: rowBefore.id,
            code: rowBefore.code,
            name: rowBefore.name,
            type: rowBefore.type,
            visibilityStatus: rowBefore.visibilityStatus,
            systemRequired: rowBefore.systemRequired,
          },
        },
      ]);

      await after;
    }),
  );

  it(
    'concurrent transaction commits BEFORE snapshot commits',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const resolveWhenNonEmpty = [];
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        async findAll() {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            if (resolveWhenNonEmpty.length > 0) {
              return [];
            }

            await sleepAsync(5);
          }
        },
      };

      const tick = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      const rowBefore = await ReferenceData.create({
        ...fakeReferenceData(),
        name: 'refData before',
      });

      const snapshot = snapshotOutgoingChanges(
        ctx.sequelize,
        {
          ReportRequest: models.ReportRequest,
          FakeModel: fakeModelThatWaitsUntilWeSaySo,
          ReferenceData: models.ReferenceData,
        },
        tick - 1,
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.sequelize.transaction(async (transaction) => {
        await ReferenceData.create(
          {
            ...fakeReferenceData(),
            name: 'refData after',
          },
          {
            transaction,
          },
        );
        await sleepAsync(200);
      });
      await sleepAsync(20);

      await after;

      // unblock snapshot
      resolveWhenNonEmpty.push(true);
      const result = await snapshot;

      const byId = (a, b) => a.recordId.localeCompare(b.recordId);
      expect(result.sort(byId)).toEqual(
        [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'reference_data',
            recordId: rowBefore.id,
            data: {
              id: rowBefore.id,
              code: rowBefore.code,
              name: rowBefore.name,
              type: rowBefore.type,
              visibilityStatus: rowBefore.visibilityStatus,
              systemRequired: rowBefore.systemRequired,
            },
          },
        ].sort(byId),
      );
    }),
  );

  it('does not crash when snapshotting more records than the stack can handle', async () => {
    // See PR#3262 for more background on this issue

    // first we figure out how many arguments we can pass to a function
    // before we hit the call stack limit, as this is not a constant and
    // may vary between machines or Node.js versions.

    function callStackIsFine(n) {
      try {
        const args = Array(n).fill(0);
        [].push(...args);
      } catch (e) {
        if (e instanceof RangeError && e.message.includes('call stack')) {
          return false;
        }

        // any other error, pass on
        throw e;
      }

      return true;
    }

    let limit = 1;
    const MAX = 1e7;
    while (callStackIsFine(limit) && limit < MAX) {
      limit *= 2;
    }
    while (!callStackIsFine(limit) && limit > 0) {
      limit -= 1;
    }

    if (limit >= MAX || limit < 1) {
      throw new Error(`Could not determine call stack limit, got ${limit}`);
    }

    // now we can use this limit to test the snapshotting
    const { LocalSystemFact } = models;

    // start a sync session
    const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

    // create a bunch of records, more than the call stack limit
    await ctx.sequelize.query(`
      INSERT INTO reference_data (id, created_at, updated_at, type, code, name)
      SELECT
        gen_random_uuid() as id,
        now() as created_at,
        now() as updated_at,
        'test' as type,
        gen_random_uuid() || '-' || generate_series as code,
        gen_random_uuid() || '-' || generate_series as name
      FROM generate_series(1, ${limit + 100});
    `);

    // run the snapshot, which should not crash
    // const start = new Date;
    await snapshotOutgoingChanges(
      ctx.sequelize,
      {
        ReferenceData: models.ReferenceData,
      },
      tock - 1,
    );
    // console.log(`Snapshotting ${limit + 100} records took ${new Date - start}ms`);
  });
});
