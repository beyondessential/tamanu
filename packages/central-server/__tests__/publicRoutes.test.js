import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './utilities';

describe('Public routes', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });

  afterAll(() => ctx.close());

  it.each(['/api', '/v1'])(
    'refuses the former lab result widget address without sign-in (%s)',
    async prefix => {
      const result = await baseApp.get(`${prefix}/public/labResultWidget/ABC123`);

      expect(result.status).toBe(400);
      expect(result.body).not.toHaveProperty('data');
    },
  );
});
