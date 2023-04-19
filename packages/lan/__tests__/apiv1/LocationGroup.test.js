import { findOneOrCreate } from 'shared/test-helpers/factory';
import { createTestContext } from '../utilities';

describe('Location groups', () => {
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });
  afterAll(() => ctx.close());

  it('should create a location group', async () => {
    const facility = await findOneOrCreate(models, models.Facility, {
      name: 'Test Facility',
    });
    const group = await models.LocationGroup.create({
      name: 'Test Location Group',
      code: 'test-location-group',
      facilityId: facility.id,
    });
    expect(group).toBeInstanceOf(models.LocationGroup);
  });
  it('should fail if locationGroup name contains a comma', async () => {
    const facility = await findOneOrCreate(models, models.Facility, {
      name: 'Test Facility',
    });
    expect(
      models.LocationGroup.create({
        name: 'Test, Location Group',
        code: 'test-location-group',
        facilityId: facility.id,
      }),
    ).rejects.toThrowError('A location group name cannot include a comma.');
  });
});
