import config from 'config';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { VRSActionRetrier } from 'sync-server/app/tasks/VRSActionRetrier';
import { prepareVRSMocks } from './sharedHookHelpers';

const { host } = config.integrations.fijiVrs;

describe('VRS integration - VRSActionRetrier', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  beforeEach(() => {
    // clear token before each test case
    ctx.integrations.fijiVrs.remote.fetchImplementation = null;
    ctx.integrations.fijiVrs.remote.token = null;
  });

  it('fetches and retries old pending actions', async () => {
    // arrange
    const { Patient } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);
    const task = new VRSActionRetrier(ctx);

    // act
    await task.run();

    // assert
    const foundPatient = await Patient.findOne({
      where: { displayId: vrsPatient.individual_refno },
      raw: true,
    });
    expect(foundPatient).toMatchObject({
      displayId: vrsPatient.individual_refno,
    });
    const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
    expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/FetchAllPendingActions`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
      expect.anything(),
    );
  });

  it("doesn't retry recent pending actions", async () => {
    // arrange
    const { Patient } = ctx.store.models;
    const { fetchId, vrsPatient } = await prepareVRSMocks(ctx, {
      fetchAllPendingActionsImpl: mockFetchId => ({
        ok: true,
        status: 200,
        json: async () => ({
          response: 'success',
          data: [
            {
              Id: mockFetchId,
              Operation: 'INSERT',
              CreatedDateTime: new Date().toISOString(),
            },
          ],
        }),
      }),
    });
    const task = new VRSActionRetrier(ctx);

    // act
    await task.run();

    // assert
    const foundPatient = await Patient.findOne({
      where: { displayId: vrsPatient.individual_refno },
      raw: true,
    });
    expect(foundPatient).toBe(null);
    const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
    expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      `${host}/api/Tamanu/FetchAllPendingActions`,
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
      expect.anything(),
    );
  });
});
