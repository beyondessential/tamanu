import { createTestContext } from './utilities';
import { fake } from 'shared/test-helpers';

describe('Reports', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('should include the currentFacilityId parameter', async () => {
    const { User, ReportDefinitionVersion } = ctx.store.models;
    const user = await User.create(fake(User))
    const def = await ReportDefinitionVersion.create({
      versionNumber: 1,
      status: 'published',
      userId: user.id,
      queryOptions: JSON.stringify({
        defaultDateRange: 'allTime',
        parameters: [{ parameterField: 'DummyField', name: 'dummy' }],
      }),
      query: 'SELECT id FROM facilities WHERE id = :currentFacilityId'
    });
    const report = await def.dataGenerator(ctx.store, {});
    
    // we expect 0 results - we're on the central server
    expect(report).toEqual([]);
  });

});
