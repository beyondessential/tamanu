import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from './utilities';

describe('facility routes', () => {
  let ctx;
  let baseApp;
  let models;
  let userApp;
  let facilities;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    const user = await models.User.create(fake(models.User, { role: 'practitioner' }));
    userApp = await baseApp.asUser(user);

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
    await models.UserFacility.create({
      userId: user.id,
      facilityId: facilityOne.id,
    });
    await models.UserFacility.create({
      userId: user.id,
      facilityId: facilityTwo.id,
    });
    await models.UserFacility.create({
      userId: user.id,
      facilityId: facilityThree.id,
    });
    facilities = [facilityOne, facilityTwo, facilityThree];
  });

  afterAll(async () => ctx.close());

  it('should receive the correct count of facilities', async () => {
    const { body: result } = await userApp.get('/api/facility');
    expect(result.count).toBe(3);
  });

  it('should receive the correct facilities', async () => {
    const { body: result } = await userApp.get('/api/facility');

    expect(result.data[0].code).toBe(facilities[0].code);
    expect(result.data[0].name).toBe(facilities[0].name);

    expect(result.data[1].code).toBe(facilities[1].code);
    expect(result.data[1].name).toBe(facilities[1].name);

    expect(result.data[2].code).toBe(facilities[2].code);
    expect(result.data[2].name).toBe(facilities[2].name);
  });
});
