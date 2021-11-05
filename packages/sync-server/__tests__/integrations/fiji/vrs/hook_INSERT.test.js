import { parseISO } from 'date-fns';

import { createTestContext } from 'sync-server/__tests__/utilities';
import { fakeVRSPatient, prepareVRSMocks } from './sharedHookHelpers';

describe('VRS integration - hook - INSERT', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await createTestContext();
  });
  afterEach(async () => ctx.close());

  it('completes successfully', async () => {
    // arrange
    const { Patient, PatientAdditionalData, PatientVRSData, ReferenceData } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);

    // act
    const response = await ctx.baseApp
      .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'INSERT',
        created_datetime: new Date().toISOString(),
      });

    // assert
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual({
      response: false,
    });
    const foundPatient = await Patient.findOne({
      where: { displayId: vrsPatient.individual_refno },
      raw: true,
    });
    const expectedVillage = await ReferenceData.findOne({
      name: vrsPatient.sub_division,
    });
    expect(foundPatient).toEqual({
      id: expect.any(String),
      displayId: vrsPatient.individual_refno,
      firstName: vrsPatient.fname,
      middleName: null,
      lastName: vrsPatient.lname,
      culturalName: null,
      dateOfBirth: parseISO(vrsPatient.dob),
      sex: vrsPatient.sex.toLowerCase(),
      villageId: expectedVillage.id,
      email: vrsPatient.email,

      // metadata
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
      markedForSync: expect.anything(),
    });
    const foundAdditionalData = await PatientAdditionalData.findOne({
      where: { patientId: foundPatient.id },
      raw: true,
    });
    expect(foundAdditionalData).toMatchObject({
      primaryContactNumber: vrsPatient.phone,
      deletedAt: null,
    });
    const foundVRSData = await PatientVRSData.findOne({
      where: { patientId: foundPatient.id },
      raw: true,
    });
    expect(foundVRSData).toMatchObject({
      idType: vrsPatient.id_type,
      identifier: vrsPatient.identifier,
      unmatchedVillageName: null,
      deletedAt: null,
    });
  });

  it('throws an error if a required field is missing', async () => {
    // arrange
    const { fetchId } = await prepareVRSMocks(ctx, {
      vrsPatient: {
        ...(await fakeVRSPatient(ctx.store.models)),
        individual_refno: null, // missing required field
      },
    });

    // act
    const response = await ctx.baseApp
      .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'INSERT',
        created_datetime: new Date().toISOString(),
      });

    // assert
    expect(response).toHaveRequestError();
  });

  it('throws an error if a field is of the wrong type', async () => {
    // arrange
    const { fetchId } = await prepareVRSMocks(ctx, {
      vrsPatient: {
        ...(await fakeVRSPatient(ctx.store.models)),
        dob: 'this is not a valid ISO date',
      },
    });

    // act
    const response = await ctx.baseApp
      .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'INSERT',
        created_datetime: new Date().toISOString(),
      });

    // assert
    expect(response).toHaveRequestError();
  });

  it('saves unmatched village names so they can be fixed later', async () => {
    // arrange
    const { models } = ctx.store;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx, {
      vrsPatient: {
        ...(await fakeVRSPatient(models)),
        sub_division: 'this string does not match a village name',
      },
    });

    // act
    const response = await ctx.baseApp
      .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'INSERT',
        created_datetime: new Date().toISOString(),
      });

    // assert
    expect(response).toHaveSucceeded();
    const foundVRSData = await models.PatientVRSData.findOne({
      include: {
        association: 'patient',
        where: { displayId: vrsPatient.individual_refno },
      },
      raw: true,
    });
    expect(foundVRSData).toMatchObject({
      unmatchedVillageName: vrsPatient.sub_division,
    });
  });

  it.todo('rejects invalid credentials');
  it.todo('resurrects deleted records');
});
