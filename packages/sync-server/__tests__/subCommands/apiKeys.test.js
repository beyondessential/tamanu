import { fake } from 'shared/test-helpers/fake';
import { DEFAULT_JWT_SECRET } from '../../app/auth';
import { verifyToken } from '../../app/auth/utils';
import { genToken } from '../../app/subCommands/apiKeys/issue';
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
    const token = await genToken('default', user.email, { expiresIn: '1 day' });
    const result = await verifyToken(token, DEFAULT_JWT_SECRET);

    // handle off-by-one error when the second ticks over
    const expectedExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    expect(result.exp).toBeLessThanOrEqual(expectedExp);
    expect(result.exp).toBeGreaterThanOrEqual(expectedExp - 1);
  });
});
