import { createTestContext } from '../utilities';

describe('FHIR job stats', () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('admin');
    await ctx.store.models.FhirJob.truncate();
  });
  afterAll(async () => {
    await ctx.store.models.FhirJob.truncate();
    await ctx.close();
  });

  it('returns ordered counts for all job types', async () => {
    // arrange
    const {
      models: { FhirJob },
    } = ctx.store;
    await Promise.all(
      ['topic1', 'topic2', 'topic2', 'topic2', 'topic3', 'topic3'].map(t =>
        FhirJob.submit(t, { payload: 'value' }),
      ),
    );

    // act
    const response = await app.get('/api/admin/fhir/jobStats?order=desc&orderBy=count');

    // assert
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: 'fhir.refresh.allFromUpstream,Queued',
        topic: 'fhir.refresh.allFromUpstream',
        status: 'Queued',
        count: '18',
      },
      { id: 'topic2,Queued', topic: 'topic2', status: 'Queued', count: '3' },
      { id: 'topic3,Queued', topic: 'topic3', status: 'Queued', count: '2' },
      { id: 'topic1,Queued', topic: 'topic1', status: 'Queued', count: '1' },
    ]);
    expect(response.body.count).toBe(4);
  });
});
