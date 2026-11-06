import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { fakeReferenceData } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK, FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';

import { createTestContext } from '../utilities';
import { hasUnpushedChanges } from '../../app/sync/hasUnpushedChanges';

describe('hasUnpushedChanges', () => {
  let ctx;
  let models;
  let originalPushCursor;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    originalPushCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
  });

  afterEach(async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, originalPushCursor);
  });

  afterAll(() => ctx.close());

  // Moves the local clock on, so that rows written after this have a tick above the returned one
  const startNewTick = () => models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);

  it('is false when nothing has changed since the last successful push', async () => {
    const tick = await startNewTick();
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick));

    expect(await hasUnpushedChanges(models)).toBe(false);
  });

  it('is true when a row that pushes to central changed since the last successful push', async () => {
    const tick = await startNewTick();
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick - 1));
    await models.ReferenceData.create(fakeReferenceData());

    expect(await hasUnpushedChanges(models)).toBe(true);
  });

  it('counts a soft-deleted row as a change to push', async () => {
    const row = await models.ReferenceData.create(fakeReferenceData());
    const tick = await startNewTick();
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick - 1));
    await row.destroy();

    expect(await hasUnpushedChanges(models)).toBe(true);
  });

  it('is false for a row once the push cursor has caught up with it', async () => {
    await models.ReferenceData.create(fakeReferenceData());
    const tick = await startNewTick();
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick));

    expect(await hasUnpushedChanges(models)).toBe(false);
  });

  it('reads a missing push cursor as -1, as pushing does', async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, null);
    await models.ReferenceData.create(fakeReferenceData());

    expect(await hasUnpushedChanges(models)).toBe(true);
  });
});
