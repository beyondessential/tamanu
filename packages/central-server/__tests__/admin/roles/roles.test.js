import { createTestContext } from '../../utilities';
import { destroySampleRoles } from './helpers';
import { describeRolesDelete } from './roles.delete';
import { describeRolesGet } from './roles.get';
import { describeRolesPost } from './roles.post';

describe('Admin roles', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;
  /** Authenticated user with no Role admin permissions. */
  let noPermissionApp;

  const getTestContext = () => ({ models, baseApp, adminApp, noPermissionApp });

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
    noPermissionApp = await baseApp.asRole('practitioner');
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await destroySampleRoles(models);
  });

  describeRolesGet(getTestContext);

  describeRolesPost(getTestContext);

  describeRolesDelete(getTestContext);
});
