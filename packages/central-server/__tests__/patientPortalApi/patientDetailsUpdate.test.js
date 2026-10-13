import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const PORTAL_EMAIL = 'details-update@test.com';

describe('Patient Portal: updating patient details', () => {
  let baseApp;
  let store;
  let close;
  let patient;
  let authToken;
  let ethnicity;
  let retiredEthnicity;

  const updateDetails = body =>
    baseApp.put('/api/portal/me').set('Authorization', `Bearer ${authToken}`).send(body);

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, Setting } = store.models;

    await Setting.set('features.patientPortal', true);
    patient = await Patient.create(
      fake(Patient, { firstName: 'Tess', lastName: 'Lavea', email: 'tess@old.example' }),
    );
    await PortalUser.create({
      email: PORTAL_EMAIL,
      patientId: patient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });
    ethnicity = await ReferenceData.create(
      fake(ReferenceData, { type: REFERENCE_TYPES.ETHNICITY, name: 'Samoan' }),
    );
    retiredEthnicity = await ReferenceData.create(
      fake(ReferenceData, {
        type: REFERENCE_TYPES.ETHNICITY,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      }),
    );
    authToken = await getPatientAuthToken(baseApp, store.models, PORTAL_EMAIL);
  });

  beforeEach(async () => {
    await store.models.PatientAdditionalData.destroy({
      where: { patientId: patient.id },
      force: true,
    });
  });

  afterAll(async () => close());

  it('writes the details sent and returns the updated patient', async () => {
    const response = await updateDetails({
      primaryContactNumber: '+685 21 234',
      cityTown: 'Apia',
      ethnicityId: ethnicity.id,
    });

    expect(response).toHaveSucceeded();
    expect(response.body.additionalData).toMatchObject({
      primaryContactNumber: '+685 21 234',
      cityTown: 'Apia',
      ethnicityId: ethnicity.id,
      ethnicity: { id: ethnicity.id, name: 'Samoan' },
    });
    const saved = await store.models.PatientAdditionalData.getForPatient(patient.id);
    expect(saved.cityTown).toEqual('Apia');
  });

  it('leaves details that were not sent as they are', async () => {
    await store.models.PatientAdditionalData.create({
      patientId: patient.id,
      streetVillage: '12 Beach Road',
      emergencyContactName: 'Sina',
    });

    const response = await updateDetails({ emergencyContactName: 'Mele' });

    expect(response).toHaveSucceeded();
    const saved = await store.models.PatientAdditionalData.getForPatient(patient.id);
    expect(saved.streetVillage).toEqual('12 Beach Road');
    expect(saved.emergencyContactName).toEqual('Mele');
  });

  it('clears a detail sent blank', async () => {
    await store.models.PatientAdditionalData.create({
      patientId: patient.id,
      secondaryContactNumber: '555 1234',
    });

    const response = await updateDetails({ secondaryContactNumber: '' });

    expect(response).toHaveSucceeded();
    const saved = await store.models.PatientAdditionalData.getForPatient(patient.id);
    expect(saved.secondaryContactNumber).toBeNull();
  });

  it('changes the email on the patient record and not the sign-in email', async () => {
    const response = await updateDetails({ email: 'tess@new.example' });

    expect(response).toHaveSucceeded();
    expect(response.body.email).toEqual('tess@new.example');
    await patient.reload();
    expect(patient.email).toEqual('tess@new.example');
    const portalUser = await store.models.PortalUser.findOne({ where: { patientId: patient.id } });
    expect(portalUser.email).toEqual(PORTAL_EMAIL);
  });

  it('rejects an email or phone number in the wrong format', async () => {
    expect(await updateDetails({ email: 'not an email' })).toHaveRequestError();
    expect(await updateDetails({ primaryContactNumber: 'call me' })).toHaveRequestError();
  });

  it('rejects details a patient cannot change', async () => {
    expect(await updateDetails({ firstName: 'Someone' })).toHaveRequestError();
    expect(await updateDetails({ bloodType: 'O+' })).toHaveRequestError();
  });

  it('rejects reference data that is not current, or of the wrong type', async () => {
    expect(await updateDetails({ ethnicityId: retiredEthnicity.id })).toHaveRequestError();
    expect(await updateDetails({ occupationId: ethnicity.id })).toHaveRequestError();
  });

  it('rejects a title outside the standard list', async () => {
    expect(await updateDetails({ title: 'Captain' })).toHaveRequestError();
    expect(await updateDetails({ title: 'Dr' })).toHaveSucceeded();
  });

  it('keeps required details from being cleared, and hidden ones from being changed', async () => {
    await store.models.Setting.set('fields', {
      primaryContactNumber: { required: true },
      occupationId: { hidden: true },
    });
    settingsCache.reset();

    expect(await updateDetails({ primaryContactNumber: '' })).toHaveRequestError();
    expect(await updateDetails({ primaryContactNumber: '555 1234' })).toHaveSucceeded();
    expect(await updateDetails({ occupationId: null })).toHaveRequestError();
  });

  it('rejects a request without a portal sign-in', async () => {
    const response = await baseApp.put('/api/portal/me').send({ cityTown: 'Apia' });
    expect(response).toHaveRequestError();
  });
});
