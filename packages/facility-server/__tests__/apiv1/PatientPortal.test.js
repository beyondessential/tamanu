import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { createTestContext } from '../utilities';

describe('Patient portal registration', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('admin');
    await models.Facility.upsert({ id: facilityId, name: facilityId, code: facilityId });
  });
  afterAll(() => ctx.close());

  it('registers several patients with the same email', async () => {
    const email = 'shared-parent@test.com';
    const patients = await Promise.all([
      models.Patient.create(fake(models.Patient)),
      models.Patient.create(fake(models.Patient)),
    ]);

    for (const patient of patients) {
      const response = await app
        .post(`/api/patient/${patient.id}/portal/register`)
        .send({ email, facilityId });
      expect(response).toHaveSucceeded();
    }

    const portalUsers = await models.PortalUser.findAll({ where: { email } });
    expect(portalUsers.map(({ patientId }) => patientId).sort()).toEqual(
      patients.map(({ id }) => id).sort(),
    );
  });
});
