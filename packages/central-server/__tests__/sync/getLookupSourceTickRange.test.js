import { getLookupSourceTickRange } from '../../app/sync/getLookupSourceTickRange';
import { createTestContext } from '../utilities';

describe('getLookupSourceTickRange', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  beforeEach(async () => {
    await models.SyncLookupTick.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  const createLookupTicks = ticks =>
    models.SyncLookupTick.bulkCreate(
      ticks.map(([sourceStartTick, lookupEndTick]) => ({ sourceStartTick, lookupEndTick })),
    );

  it('returns an empty range when no lookup ticks fall in the window', async () => {
    await createLookupTicks([[1, 10]]);

    expect(await getLookupSourceTickRange(ctx.store, 10, 100)).toEqual({});
  });

  // BIGINT columns come back as strings
  it('spans from the first lookup source tick to the last lookup end tick', async () => {
    await createLookupTicks([
      [1, 10],
      [10, 20],
      [20, 30],
      [30, 40],
    ]);

    expect(await getLookupSourceTickRange(ctx.store, 10, 40)).toEqual({
      minSourceTick: '10',
      maxSourceTick: '30',
    });
  });

  it('covers every lookup tick for an initial sync', async () => {
    await createLookupTicks([
      [1, 10],
      [10, 20],
      [20, 30],
    ]);

    expect(await getLookupSourceTickRange(ctx.store, -1, 100)).toEqual({
      minSourceTick: '1',
      maxSourceTick: '30',
    });
  });
});
