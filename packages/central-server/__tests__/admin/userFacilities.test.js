import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Admin user allowed facilities', () => {
  let ctx;
  let models;
  let adminApp;
  let facilityA;
  let facilityB;
  let role;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
    facilityA = await models.Facility.create(fake(models.Facility));
    facilityB = await models.Facility.create(fake(models.Facility));
    role = await models.Role.create(fake(models.Role));
  });
  afterAll(async () => {
    await ctx.close();
  });

  const allowedFacilityIds = async userId => {
    const rows = await models.UserFacility.findAll({ where: { userId } });
    return rows.map(({ facilityId }) => facilityId).sort();
  };

  it('creates and edits a user with allowed facilities', async () => {
    const email = 'allowed-facilities@tamanu.io';
    const created = await adminApp.post('/api/admin/users').send({
      displayName: 'Allowed Facilities',
      role: role.id,
      email,
      password: 'allowed-facilities-pw',
      allowedFacilityIds: [facilityA.id],
    });
    expect(created).toHaveSucceeded();
    const user = await models.User.findOne({ where: { email } });
    expect(await allowedFacilityIds(user.id)).toEqual([facilityA.id]);

    const update = allowedFacilityIds =>
      adminApp.put(`/api/admin/users/${user.id}`).send({
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        displayName: 'Allowed Facilities',
        role: role.id,
        email,
        allowedFacilityIds,
      });

    expect(await update([facilityA.id, facilityB.id])).toHaveSucceeded();
    expect(await allowedFacilityIds(user.id)).toEqual([facilityA.id, facilityB.id].sort());

    expect(await update([facilityB.id])).toHaveSucceeded();
    expect(await allowedFacilityIds(user.id)).toEqual([facilityB.id]);

    expect(await update([facilityA.id, facilityB.id])).toHaveSucceeded();
    expect(await allowedFacilityIds(user.id)).toEqual([facilityA.id, facilityB.id].sort());
  });
});
