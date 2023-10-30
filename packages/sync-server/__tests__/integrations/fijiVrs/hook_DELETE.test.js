import config from 'config';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { prepareVRSMocks } from './sharedHookHelpers';

const { host } = config.integrations.fijiVrs;

describe('VRS integration - hook - DELETE', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  // skipped while integrations.fijiVrs.flagInsteadOfDeleting is still enabled
  it.skip('deletes a record successfully', async () => {
    // arrange
    const { Patient } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);
    await Patient.create({
      ...fake(Patient),
      displayId: vrsPatient.individual_refno,
    });

    // act
    const response = await app
      .post(`/v1/integration/fijiVrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'DELETE',
        created_datetime: new Date().toISOString(),
      })
      .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

    // assert
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual({
      response: true,
    });

    const foundPatient = await Patient.findOne({
      where: { displayId: vrsPatient.individual_refno },
      raw: true,
      paranoid: false,
    });
    expect(foundPatient).toMatchObject({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: expect.any(Date),
    });

    const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
    expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('marks a record as deleted', async () => {
    // arrange
    const { Patient, PatientVRSData } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);
    await Patient.create({
      ...fake(Patient),
      displayId: vrsPatient.individual_refno,
    });

    // act
    const response = await app
      .post(`/v1/integration/fijiVrs/hooks/patientCreated`)
      .send({
        fetch_id: fetchId,
        operation: 'DELETE',
        created_datetime: new Date().toISOString(),
      })
      .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

    // assert
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual({
      response: true,
    });

    const foundPatient = await Patient.findOne({
      where: { displayId: vrsPatient.individual_refno },
      raw: true,
      paranoid: false,
    });
    expect(foundPatient).toMatchObject({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
    });

    const foundPatientVRSData = await PatientVRSData.findOne({
      include: {
        association: 'patient',
        where: { displayId: vrsPatient.individual_refno },
      },
    });
    expect(foundPatientVRSData).toMatchObject({
      isDeletedByRemote: true,
    });

    const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
    expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
