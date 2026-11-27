import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import { PORTAL_USER_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
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

  it('asks a registered patient moved to a new email to register again', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PortalUser.create({
      patientId: patient.id,
      email: 'before@test.com',
      status: PORTAL_USER_STATUSES.REGISTERED,
    });

    const response = await app
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ email: 'after@test.com', facilityId });
    expect(response).toHaveSucceeded();

    const portalUser = await models.PortalUser.findOne({ where: { patientId: patient.id } });
    expect(portalUser.status).toBe(PORTAL_USER_STATUSES.PENDING);
  });

  it.each([
    ['the same email', 'same@test.com'],
    ['the email in other letter cases', 'Same@Test.com'],
  ])('keeps a patient registered when sent %s', async (_, sentEmail) => {
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PortalUser.create({
      patientId: patient.id,
      email: 'same@test.com',
      status: PORTAL_USER_STATUSES.REGISTERED,
    });

    const response = await app
      .post(`/api/patient/${patient.id}/portal/register`)
      .send({ email: sentEmail, facilityId });
    expect(response).toHaveSucceeded();

    const portalUser = await models.PortalUser.findOne({ where: { patientId: patient.id } });
    expect(portalUser.status).toBe(PORTAL_USER_STATUSES.REGISTERED);
  });

  describe('removing portal access', () => {
    const registeredPatient = async email => {
      const patient = await models.Patient.create(fake(models.Patient));
      await models.PortalUser.create({
        patientId: patient.id,
        email,
        status: PORTAL_USER_STATUSES.REGISTERED,
      });
      return patient;
    };

    it('takes the patient off their email', async () => {
      const patient = await registeredPatient('removing@test.com');

      const response = await app.delete(`/api/patient/${patient.id}/portal`);
      expect(response).toHaveSucceeded();

      const portalUser = await models.PortalUser.findOne({ where: { patientId: patient.id } });
      expect(portalUser.visibilityStatus).toBe(VISIBILITY_STATUSES.HISTORICAL);
      const status = await app.get(`/api/patient/${patient.id}/portal/status`);
      expect(status.body).toEqual({ hasPortalAccount: false, status: null });
      const patientResponse = await app.get(`/api/patient/${patient.id}`);
      expect(patientResponse.body.portalUser).toBeNull();
    });

    it('asks a removed patient to register again when sent a new link', async () => {
      const patient = await registeredPatient('returning@test.com');
      await app.delete(`/api/patient/${patient.id}/portal`);

      const response = await app
        .post(`/api/patient/${patient.id}/portal/register`)
        .send({ email: 'returning@test.com', facilityId });
      expect(response).toHaveSucceeded();

      const portalUser = await models.PortalUser.findOne({ where: { patientId: patient.id } });
      expect(portalUser.visibilityStatus).toBe(VISIBILITY_STATUSES.CURRENT);
      expect(portalUser.status).toBe(PORTAL_USER_STATUSES.PENDING);
    });

    it('says so when the patient has no portal access', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const response = await app.delete(`/api/patient/${patient.id}/portal`);
      expect(response.status).toBe(404);
    });

    it('forbids a user without permission to register', async () => {
      const patient = await registeredPatient('kept@test.com');
      const noPermsApp = await ctx.baseApp.asRole('base');
      const response = await noPermsApp.delete(`/api/patient/${patient.id}/portal`);
      expect(response).toBeForbidden();
    });
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
