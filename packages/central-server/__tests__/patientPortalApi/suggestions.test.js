import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PORTAL_SUGGESTER_ALLOW_LIST,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'suggestions-patient@test.com';

describe('Patient Portal suggestions', () => {
  let baseApp;
  let store;
  let close;
  let authToken;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, Setting } = store.models;

    await Setting.set('features.patientPortal', true);

    const patient = await Patient.create(fake(Patient));
    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: patient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });
    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
  });

  afterAll(async () => close());

  const createDrug = async ({ name, isSensitive }) => {
    const { ReferenceData, ReferenceDrug } = store.models;
    const drug = await ReferenceData.create(
      fake(ReferenceData, { type: REFERENCE_TYPES.DRUG, name }),
    );
    await ReferenceDrug.create(fake(ReferenceDrug, { referenceDataId: drug.id, isSensitive }));
    return drug;
  };

  it('searches allowed reference data', async () => {
    const diagnosis = await store.models.ReferenceData.create(
      fake(store.models.ReferenceData, { type: REFERENCE_TYPES.DIAGNOSIS, name: 'Portalitis' }),
    );

    const response = await baseApp
      .get('/api/portal/suggestions/diagnosis')
      .query({ q: 'Portalitis' })
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
    expect(response.body.map(record => record.id)).toContain(diagnosis.id);
  });

  it.each(PORTAL_SUGGESTER_ALLOW_LIST)('answers a %s search', async endpoint => {
    const response = await baseApp
      .get(`/api/portal/suggestions/${endpoint}`)
      .query({ q: 'a' })
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
  });

  it('looks up a record by id', async () => {
    const diagnosis = await store.models.ReferenceData.create(
      fake(store.models.ReferenceData, { type: REFERENCE_TYPES.DIAGNOSIS }),
    );

    const response = await baseApp
      .get(`/api/portal/suggestions/diagnosis/${diagnosis.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
    expect(response.body.id).toBe(diagnosis.id);
  });

  it('looks up a sensitive drug by id', async () => {
    const sensitiveDrug = await createDrug({ name: 'Portalmycin by id', isSensitive: true });

    const response = await baseApp
      .get(`/api/portal/suggestions/drug/${sensitiveDrug.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
    expect(response.body.id).toBe(sensitiveDrug.id);
  });

  it('lists every record of a type', async () => {
    const diagnosis = await store.models.ReferenceData.create(
      fake(store.models.ReferenceData, { type: REFERENCE_TYPES.DIAGNOSIS }),
    );

    const response = await baseApp
      .get('/api/portal/suggestions/diagnosis/all')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
    expect(response.body.map(record => record.id)).toContain(diagnosis.id);
  });

  it('rejects searches without a sign-in', async () => {
    const response = await baseApp.get('/api/portal/suggestions/diagnosis').query({ q: 'x' });

    expect(response).toHaveRequestError();
  });

  it('does not create reference data', async () => {
    const response = await baseApp
      .post('/api/portal/suggestions/diagnosis/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Portal-created diagnosis' });

    expect(response.status).toBe(404);
    const created = await store.models.ReferenceData.count({
      where: { type: REFERENCE_TYPES.DIAGNOSIS, name: 'Portal-created diagnosis' },
    });
    expect(created).toBe(0);
  });

  it('leaves sensitive drugs out of drug searches', async () => {
    const drug = await createDrug({ name: 'Portalmycin', isSensitive: false });
    const sensitiveDrug = await createDrug({ name: 'Portalmycin forte', isSensitive: true });

    const response = await baseApp
      .get('/api/portal/suggestions/drug')
      .query({ q: 'Portalmycin' })
      .set('Authorization', `Bearer ${authToken}`);

    expect(response).toHaveSucceeded();
    const ids = response.body.map(record => record.id);
    expect(ids).toContain(drug.id);
    expect(ids).not.toContain(sensitiveDrug.id);
  });
});
