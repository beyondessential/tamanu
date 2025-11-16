import { fake } from '@tamanu/fake-data/fake';
import config from 'config';
import { verifyToken } from '../../dist/auth/utils';
import { genToken } from '../../dist/subCommands/apiKeys/issue';
import { createTestContext } from '../utilities';

describe('apiKeys issue', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('issues a valid API key', async () => {
    const { User } = ctx.store.models;
    const user = await User.create(fake(User));
    const token = await genToken(user.email, { expiresIn: '1 day' });
    const result = await verifyToken(token, config.auth.secret || crypto.randomUUID());

    // handle off-by-one error when the second ticks over
    const expectedExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const expValue = result.payload?.exp || result.exp;
    expect(expValue).toBeLessThanOrEqual(expectedExp);
    expect(expValue).toBeGreaterThanOrEqual(expectedExp - 1);
  });
});
