import supertest from 'supertest';

import { SYNC_PHASES } from '@tamanu/constants';
import {
  FACT_INITIAL_SYNC_PHASE,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
} from '@tamanu/constants/facts';

import { createSyncApp } from '../../app/createSyncApp';
import { createTestContext } from '../utilities';

describe('GET /sync/status', () => {
  let ctx;
  let models;
  let agent;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;

    const syncManager = {
      isSyncRunning: () => false,
      lastDurationMs: 1234,
      lastCompletedAt: new Date(),
      currentStartTime: 0,
    };
    const { express } = await createSyncApp({
      sequelize: ctx.sequelize,
      syncManager,
      models,
      deviceId: 'test-device-id',
    });
    agent = supertest(express);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '20');
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '20');
  });

  afterEach(async () => {
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, null);
  });

  it('reports which phase of the first sync is running', async () => {
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${SYNC_PHASES.CATALOGUE}`);

    const result = await agent.get('/sync/status');

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('initialSyncPhase', 'catalogue');
  });

  it('reports no phase once the first sync is complete', async () => {
    const result = await agent.get('/sync/status');

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('initialSyncPhase', null);
    expect(result.body).toHaveProperty('lastCompletedPull', 20);
  });
});
