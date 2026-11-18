import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Admin user display name uniqueness', () => {
  let ctx;
  let models;
  let adminApp;
  let role;
  let runSuffix;

  const uniqueEmail = () => `display-name-${randomUUID()}@tamanu.io`;

  const createUser = displayName =>
    adminApp.post('/api/admin/users').send({
      displayName,
      role: role.id,
      email: uniqueEmail(),
      password: 'display-name-pw',
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
    role = await models.Role.create(fake(models.Role));
    runSuffix = randomUUID().slice(0, 8);
    await models.User.create(
      fake(models.User, { displayName: `AnnXLee ${runSuffix}`, role: role.id }),
    );
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('creating a user', () => {
    it('rejects a display name that matches an existing one in different case', async () => {
      const response = await createUser(`annxlee ${runSuffix.toUpperCase()}`);
      expect(response.status).toBe(422);
    });

    it('accepts a display name differing only by an underscore in place of another character', async () => {
      const displayName = `Ann_Lee ${runSuffix}`;
      const response = await createUser(displayName);
      expect(response).toHaveSucceeded();
      expect(await models.User.count({ where: { displayName } })).toBe(1);
    });
  });

  describe('validating a user', () => {
    const isDisplayNameUnique = async displayName => {
      const response = await adminApp.post('/api/admin/users/validate').send({
        displayName,
        email: uniqueEmail(),
        role: role.id,
      });
      expect(response).toHaveSucceeded();
      return response.body.isDisplayNameUnique;
    };

    it('reports a display name matching an existing one in different case as taken', async () => {
      expect(await isDisplayNameUnique(`ANNXLEE ${runSuffix}`)).toBe(false);
    });

    it('reports a display name with a percent sign in place of other characters as unique', async () => {
      expect(await isDisplayNameUnique(`Ann%Lee ${runSuffix}`)).toBe(true);
    });
  });

  describe('updating a user', () => {
    const renameUser = (user, displayName) =>
      adminApp.put(`/api/admin/users/${user.id}`).send({
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        displayName,
        role: role.id,
        email: user.email,
      });

    it('rejects renaming to an existing display name in different case', async () => {
      const user = await models.User.create(fake(models.User, { role: role.id }));
      const response = await renameUser(user, `aNNxLEE ${runSuffix}`);
      expect(response.status).toBe(409);
    });

    it('accepts renaming to a display name with an underscore in place of another character', async () => {
      const user = await models.User.create(fake(models.User, { role: role.id }));
      const displayName = `AnnXLe_ ${runSuffix}`;
      const response = await renameUser(user, displayName);
      expect(response).toHaveSucceeded();
      await user.reload();
      expect(user.displayName).toBe(displayName);
    });
  });
});
