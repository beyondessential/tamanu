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

  it('moves a patient onto an email another patient already uses', async () => {
    const email = 'moving-parent@test.com';
    const [sibling, patient] = await Promise.all([
      models.Patient.create(fake(models.Patient)),
      models.Patient.create(fake(models.Patient)),
    ]);
    await models.PortalUser.create({ patientId: sibling.id, email });
    await models.PortalUser.create({ patientId: patient.id, email: 'old@test.com' });

    const response = await app
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ email, facilityId });
    expect(response).toHaveSucceeded();

    const portalUser = await models.PortalUser.findOne({ where: { patientId: patient.id } });
    expect(portalUser.email).toBe(email);
  });

  it('requires an email', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const response = await app
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ facilityId });
    expect(response).toHaveRequestError();
  });

  it('forbids a user without permission to register', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const noPermsApp = await ctx.baseApp.asRole('base');
    const response = await noPermsApp
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ email: 'forbidden@test.com', facilityId });
    expect(response).toBeForbidden();
  });

  it('rejects an unauthenticated request', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const response = await ctx.baseApp
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ email: 'anonymous@test.com', facilityId });
    expect(response).toHaveRequestError();
  });
});
