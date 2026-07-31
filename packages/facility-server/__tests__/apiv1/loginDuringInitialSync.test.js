import { SYNC_PHASES } from '@tamanu/constants';
import { FACT_INITIAL_SYNC_PHASE } from '@tamanu/constants/facts';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { chance, fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';

// A facility part-way through the boot phase of its first sync has no facilities to match a user
// against, which reads as a user without access unless the login path knows an initial sync is
// underway. This suite stands a user in that position: restricted to facilities, and linked to none.
describe('login during the initial sync', () => {
  disableHardcodedPermissionsForSuite();

  const password = 'PASSWORD';
  let ctx;
  let baseApp;
  let models;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;

    await models.Setting.set('auth.restrictUsersToFacilities', true);
    const role = await models.Role.create(fake(models.Role));
    user = await models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password,
      role: role.id,
    });
  });

  afterAll(async () => {
    // settings outlive the context, so put this one back to its default rather than leaving it on
    // for whichever suite runs against this database next
    await models.Setting.set('auth.restrictUsersToFacilities', false);
    await ctx.close();
  });

  afterEach(async () => {
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, null);
  });

  const login = () =>
    baseApp.post('/api/login').send({ email: user.email, password, deviceId: 'test-device-id' });

  it('reports that the server is still syncing while a phase of the first sync is in progress', async () => {
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${SYNC_PHASES.BOOT}`);

    const result = await login();

    expect(result).toHaveRequestError();
    expect(result.body.error.message).toMatch(/still completing its first sync/);
  });

  it('reports a lack of facility access once the first sync is complete', async () => {
    const result = await login();

    expect(result).toHaveRequestError();
    expect(result.body.error.message).toMatch(/does not have access to any facilities/);
  });
});
