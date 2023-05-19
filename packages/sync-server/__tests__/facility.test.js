import { createTestContext } from './utilities';

describe('facility routes', () => {
  let ctx;
  let baseApp;
  let models;
  let app;
  let facilities;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    app = await baseApp.asRole('practitioner');

    const facilityOne = await models.Facility.create({
      code: 'test-facility-1',
      name: 'Test Facility 1',
    });
    const facilityTwo = await models.Facility.create({
      code: 'test-facility-2',
      name: 'Test Facility 2',
    });
    const facilityThree = await models.Facility.create({
      code: 'test-facility-3',
      name: 'Test Facility 3',
    });
    facilities = [facilityOne, facilityTwo, facilityThree];
  });

  afterAll(async () => ctx.close());

  it('should receive the correct count of facilities', async () => {
    const { body: result } = await app.get('/v1/facility');
    expect(result.count).toBe(3);
  });

  it('should receive the correct facilities', async () => {
    const { body: result } = await app.get('/v1/facility');

    expect(result.data[0].code).toBe(facilities[0].code);
    expect(result.data[0].name).toBe(facilities[0].name);

    expect(result.data[1].code).toBe(facilities[1].code);
    expect(result.data[1].name).toBe(facilities[1].name);

    expect(result.data[2].code).toBe(facilities[2].code);
    expect(result.data[2].name).toBe(facilities[2].name);
  });
});
