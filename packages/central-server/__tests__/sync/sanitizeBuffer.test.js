import { beforeAll, describe, it } from '@jest/globals';
import * as fc from 'fast-check';
import { Transaction } from 'sequelize';

import { fake } from '@tamanu/fake-data/fake';
import {
  createSnapshotTable,
  findSyncSnapshotRecordsOrderByDependency,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

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
      fc.asyncProperty(fc.uint8Array(), (data) =>
        ctx.store.sequelize.transaction(
          { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
          async () => {
            const startTime = new Date();
            const syncSession = await SyncSession.create({
              startTime,
              lastConnectionTime: startTime,
            });
            const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

            const asset = await Asset.create(
              fake(Asset, {
                data: Buffer.from(data),
              }),
            );

            await createSnapshotTable(ctx.store.sequelize, syncSession.id);
            const result = await snapshotOutgoingChanges(
              ctx.store,
              { Asset },
              tock - 1,
              0,
              true,
              syncSession.id,
              [''],
              null,
              {
                syncAllLabRequests: false,
                isMobile: false,
              },
            );

            expect(result).toBeGreaterThan(0);

            const results = await findSyncSnapshotRecordsOrderByDependency(
              ctx.store,
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
