import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from '@tamanu/shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';

// spec: USRPRF#editing-a-profile
describe('User profile validation', () => {
  let ctx;
  let adminApp;
  let roleWritingAllUsers;
  let roleWritingOneUser;
  let roleWithoutWrite;

  const hasWriteUserPermission = async role => {
    const response = await adminApp.post('/api/admin/users/validate').send({
      displayName: 'Validation check',
      email: 'validation-check@tamanu.io',
      role,
    });
    expect(response).toHaveSucceeded();
    return response.body.hasWriteUserPermission;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    adminApp = await ctx.baseApp.asRole('admin');
    const { Permission, Role, User } = ctx.store.models;
    const otherUser = await User.create(fake(User));

    roleWritingAllUsers = await Role.create(fake(Role));
    roleWritingOneUser = await Role.create(fake(Role));
    roleWithoutWrite = await Role.create(fake(Role));
    await Permission.create({ roleId: roleWritingAllUsers.id, verb: 'write', noun: 'User' });
    await Permission.create({
      roleId: roleWritingOneUser.id,
      verb: 'write',
      noun: 'User',
      objectId: otherUser.id,
    });
    await Permission.create({ roleId: roleWithoutWrite.id, verb: 'read', noun: 'User' });
  });

  afterAll(async () => {
    unsetUseHardcodedPermissionsUseForTestsOnly();
    await ctx.close();
  });

  describe('with imported permissions', () => {
    beforeAll(() => setHardcodedPermissionsUseForTestsOnly(false));

    it('grants the admin role, which needs no permissions of its own', async () => {
      expect(await hasWriteUserPermission('admin')).toBe(true);
    });

    it('grants a role that may write every user', async () => {
      expect(await hasWriteUserPermission(roleWritingAllUsers.id)).toBe(true);
    });

    it('withholds a write permission scoped to one user', async () => {
      expect(await hasWriteUserPermission(roleWritingOneUser.id)).toBe(false);
    });

    it('withholds a role without write', async () => {
      expect(await hasWriteUserPermission(roleWithoutWrite.id)).toBe(false);
    });
  });

  describe('with built-in permissions', () => {
    beforeAll(() => setHardcodedPermissionsUseForTestsOnly(true));

    it('grants the admin role', async () => {
      expect(await hasWriteUserPermission('admin')).toBe(true);
    });

    it('withholds a built-in role without write', async () => {
      expect(await hasWriteUserPermission('practitioner')).toBe(false);
    });

    it('withholds a role the built-in permissions do not define', async () => {
      expect(await hasWriteUserPermission(roleWritingAllUsers.id)).toBe(false);
    });
  });
});
