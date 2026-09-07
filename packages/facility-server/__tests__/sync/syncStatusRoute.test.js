import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import supertest from 'supertest';

import { createTestContext } from '../utilities';
import { createSyncApp } from '../../app/createSyncApp';

// verifies spec: CAP
// Outbox backpressure is surfaced as a health signal visible to central-side
// monitoring, and this route is the only thing that puts the figures where
// monitoring can read them.
describe('sync status route', () => {
  let ctx;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    const { express } = await createSyncApp({
      sequelize: ctx.sequelize,
      syncManager: ctx.syncManager,
      models,
      deviceId: ctx.deviceId,
    });
    app = supertest(express);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
  });

  it('reports the outbox alongside the sync cursors', async () => {
    const content = Buffer.from(`awaiting its push ${randomUUID()}`);
    await ctx.blobCache.putOutbox(Readable.from(content));

    const result = await app.get('/sync/status');

    expect(result).toHaveSucceeded();
    expect(result.body.blobOutbox).toEqual({
      count: 1,
      totalBytes: content.length,
      oldestEligibleTick: null,
    });
  });

  it('reports an empty outbox rather than omitting it', async () => {
    const result = await app.get('/sync/status');

    expect(result).toHaveSucceeded();
    expect(result.body.blobOutbox).toEqual({
      count: 0,
      totalBytes: 0,
      oldestEligibleTick: null,
    });
  });
});
