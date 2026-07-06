import express from 'express';
import supertest from 'supertest';

import { buildRateLimiters } from '@tamanu/shared/utils/rateLimit';

// The limiters are no-ops under NODE_ENV=test unless explicitly opted in, so
// the full-app suites stay deterministic while this one exercises them for
// real. Uses a bare express app: the wiring onto /public/setup/sync (and the
// other auth endpoints) is a single line in routes/apiv1.
describe('buildRateLimiters', () => {
  let authMax;
  let agent;

  beforeAll(() => {
    process.env.TEST_RATE_LIMITING = 'enabled';
    const { authLimiter } = buildRateLimiters();
    delete process.env.TEST_RATE_LIMITING;

    const config = require('config');
    authMax = config.get('rateLimit.auth.max');

    const app = express();
    app.post('/setup', authLimiter, (_req, res) => res.status(401).end());
    // mirror the API error handler enough to surface the RateLimitedError status
    // eslint-disable-next-line no-unused-vars
    app.use((error, _req, res, _next) => res.status(error.status ?? 500).end());
    agent = supertest(app);
  });

  it('returns 429 once an IP exhausts its failed-attempt budget', async () => {
    for (let i = 0; i < authMax; i++) {
      await agent.post('/setup').expect(401);
    }
    await agent.post('/setup').expect(429);
  });
});
