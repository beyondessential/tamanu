import { beforeAll, describe, it } from '@jest/globals';
import * as fc from 'fast-check';
import { Transaction } from 'sequelize';

import { fake } from 'shared/test-helpers/fake';
import { createSnapshotTable, findSyncSnapshotRecords, SYNC_SESSION_DIRECTION } from 'shared/sync';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';

describe('sanitize binary data', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  // Asset is currently the only model which does this
  it('Assets should get transferred properly', async () => {
    const { Asset, LocalSystemFact, SyncSession } = models;

    await fc.assert(
      fc.asyncProperty(fc.uint8Array(), data =>
        ctx.store.sequelize.transaction(
          { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
          async () => {
            const startTime = new Date();
            const syncSession = await SyncSession.create({
              startTime,
              lastConnectionTime: startTime,
            });
            const tock = await LocalSystemFact.increment('currentSyncTick', 2);

            const asset = await Asset.create(
              fake(Asset, {
                data: Buffer.from(data),
              }),
            );

            await createSnapshotTable(ctx.store.sequelize, syncSession.id);
            const result = await snapshotOutgoingChanges(
              { Asset },
              tock - 1,
              [],
              syncSession.id,
              '',
              {
                syncAllLabRequests: false,
                syncAllEncountersForTheseVaccines: [],
                isMobile: false,
              },
            );

            expect(result).toBeGreaterThan(0);

            const results = await findSyncSnapshotRecords(
              ctx.store.sequelize,
              syncSession.id,
              SYNC_SESSION_DIRECTION.OUTGOING,
            );

            expect(results.length).toEqual(1);

            // simulate the transformation that happens on the facility
            // once this data has been received
            const sanitizedData = Asset.sanitizeForFacilityServer(results[0].data);

            expect(sanitizedData.data).toEqual(asset.data);
          },
        ),
      ),
    );
  });
});
