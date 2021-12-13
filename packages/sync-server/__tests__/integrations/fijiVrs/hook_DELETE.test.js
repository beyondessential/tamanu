import config from 'config';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { prepareVRSMocks } from './sharedHookHelpers';

const host = config.integrations.fijiVrs.host;

describe('VRS integration - hook - DELETE', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(async () => ctx.close());

  it('deletes a record successfully', async () => {
    // arrange
    const { Patient } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);
    await Patient.create({
      ...fake(Patient),
      displayId: vrsPatient.individual_refno,
    });

    // act
    const response = await app.post(`/v1/integration/fijiVrs/hooks/patientCreated`).send({
      fetch_id: fetchId,
      operation: 'DELETE',
      created_datetime: new Date().toISOString(),
    });

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
      `${host}/api/Tamanu/Fetch/${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
