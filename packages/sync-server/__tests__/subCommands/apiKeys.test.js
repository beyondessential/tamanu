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
    expect(verifyToken(token, DEFAULT_JWT_SECRET)).toMatchObject({
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });
  });
});
