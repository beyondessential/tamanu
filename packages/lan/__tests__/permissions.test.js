import { getAbilityForUser } from 'shared/permissions/rolesToPermissions';
import { createTestContext } from './utilities';

describe('Permissions', () => {
  let ctx = null;
  let baseApp = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  it('Should forbid any user without specific permission', async () => {
    const adminApp = await baseApp.asRole('reception');
    const ability = await getAbilityForUser(adminApp.user);
    const hasPermission = ability.can('fakeVerb', 'FakeNoun');
    expect(hasPermission).toBe(false);
  });

  it('Should grant every permission to the superadmin', async () => {
    const adminApp = await baseApp.asRole('admin');
    const ability = await getAbilityForUser(adminApp.user);
    const hasPermission = ability.can('fakeVerb', 'FakeNoun');
    expect(hasPermission).toBe(true);
  });
});
