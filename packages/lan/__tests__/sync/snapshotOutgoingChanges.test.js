import { expect, beforeAll, describe, it } from '@jest/globals';

import { fakeReferenceData, withErrorShown } from 'shared/test-helpers';
import { SYNC_SESSION_DIRECTION } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { fakeUUID } from 'shared/utils/generateId';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';

const readOnlyConfig = readOnly => ({ sync: { readOnly } });

describe('snapshotOutgoingChanges', () => {
  let ctx, models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  it(
    'if in readOnly mode returns empty array',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tick = await LocalSystemFact.increment('currentSyncTime');

      const result = await snapshotOutgoingChanges.overrideConfig(
        ctx.sequelize,
        models,
        fakeUUID(),
        tick - 1,
        readOnlyConfig(true),
      );

      expect(result).toEqual([]);
    }),
  );

  it(
    'if nothing changed returns empty array',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tick = await LocalSystemFact.increment('currentSyncTime');

      const result = await snapshotOutgoingChanges(ctx.sequelize, models, fakeUUID(), tick - 1);
      expect(result).toEqual([]);
    }),
  );

  it(
    'returns serialised records (excluding metadata columns)',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;
      const tick = await LocalSystemFact.increment('currentSyncTime');

      const row = await ReferenceData.create(fakeReferenceData());
      const sessionId = fakeUUID();

      const result = await snapshotOutgoingChanges(ctx.sequelize, models, sessionId, tick - 1);

      expect(result).toEqual([
        {
          sessionId,
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
          },
        },
      ]);
    }),
  );

  it(
    'returns records changed since given tick only',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const tickBefore = await LocalSystemFact.increment('currentSyncTime');
      await ReferenceData.create(fakeReferenceData());

      await LocalSystemFact.increment('currentSyncTime');
      const row = await ReferenceData.create(fakeReferenceData());

      const sessionId = fakeUUID();
      const result = await snapshotOutgoingChanges(ctx.sequelize, models, sessionId, tickBefore);

      expect(result).toEqual([
        {
          sessionId,
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
          },
        },
      ]);
    }),
  );

  it(
    'returns records changed since more than one tick',
    withErrorShown(async () => {
      const { LocalSystemFact, ReferenceData } = models;

      const tickBefore = await LocalSystemFact.increment('currentSyncTime');
      const rowBefore = await ReferenceData.create(fakeReferenceData());

      await LocalSystemFact.increment('currentSyncTime');
      const rowAfter = await ReferenceData.create(fakeReferenceData());

      const sessionId = fakeUUID();
      const result = await snapshotOutgoingChanges(
        ctx.sequelize,
        models,
        sessionId,
        tickBefore - 1,
      );

      expect(result).toEqual([
        {
          sessionId,
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
          },
        },
        {
          sessionId,
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
          while (true) {
            if (resolveWhenNonEmpty.length > 0) {
              return [];
            }

            await sleepAsync(5);
          }
        },
      };

      const tick = await LocalSystemFact.increment('currentSyncTime');
      const rowBefore = await ReferenceData.create({
        ...fakeReferenceData(),
        name: 'refData before',
      });

      const sessionId = fakeUUID();
      const snapshot = snapshotOutgoingChanges(
        ctx.sequelize,
        {
          // the transaction needs to have a select, ANY select, so the database
          // actually takes a snapshot of the db at that point in time. THEN we
          // can pause the transaction, and test the behaviour.
          Facility: models.Facility,
          FakeModel: fakeModelThatWaitsUntilWeSaySo,
          ReferenceData: models.ReferenceData,
        },
        sessionId,
        tick - 1,
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.sequelize.transaction(async transaction => {
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
          sessionId,
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
          while (true) {
            if (resolveWhenNonEmpty.length > 0) {
              return [];
            }

            await sleepAsync(5);
          }
        },
      };

      const tick = await LocalSystemFact.increment('currentSyncTime');
      const rowBefore = await ReferenceData.create({
        ...fakeReferenceData(),
        name: 'refData before',
      });

      const sessionId = fakeUUID();
      const snapshot = snapshotOutgoingChanges(
        ctx.sequelize,
        {
          Facility: models.Facility,
          FakeModel: fakeModelThatWaitsUntilWeSaySo,
          ReferenceData: models.ReferenceData,
        },
        sessionId,
        tick - 1,
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      let rowAfter;
      const after = ctx.sequelize.transaction(async transaction => {
        rowAfter = await ReferenceData.create(
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
            sessionId,
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
            },
          },
        ].sort(byId),
      );
    }),
  );
});
