import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../../utilities';
import { genToken } from '../../../app/subCommands/apiKeys/issue';

describe('omniLab auth', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('does not allow default API keys', async () => {
    const app = await ctx.baseApp.asRole('admin');
    const request = await app.get('/v1/public/integration/omniLab');
    expect(request).not.toHaveSucceeded();
  });

  it('allows specially issued API keys', async () => {
    // arrange
    const app = ctx.baseApp;
    const { User } = ctx.store.models;
    const user = await User.create(fake(User));
    const token = await genToken('omniLab', user.email, { expiresIn: '1 day' });

    // act
    const request = await app
      .get('/v1/public/integration/omniLab')
      .set('Authorization', `Bearer ${token}`);

    // assert
    expect(request).toHaveSucceeded();
  });
});
