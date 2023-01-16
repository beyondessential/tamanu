import { createTestContext } from '../../utilities';

describe('FhirMaterialiseJob', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await ctx.store.models.FhirMaterialiseJob.destroy({
      where: {},
      paranoid: false,
      truncate: true,
    });
  });

  describe('enqueue', () => {
    it('queues up jobs', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job = { upstreamId: 'up1', resource: 'r1' };

      // act
      await FhirMaterialiseJob.enqueue(job);

      // assert
      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        upstreamId: 'up1',
        resource: 'r1',
        status: 'Queued',
        startedAt: null,
        completedAt: null,
        erroredAt: null,
        error: null,
      });
    });

    it("doesn't create duplicates with status=Queued", async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job = { upstreamId: 'up2', resource: 'r2' };

      // act
      await FhirMaterialiseJob.enqueue(job);
      await FhirMaterialiseJob.enqueueMultiple([job, job]);

      // assert
      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(1);
    });

    it('does allow duplicates with other statuses', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job = { upstreamId: 'up3', resource: 'r3' };

      // act
      await FhirMaterialiseJob.enqueue(job);
      await FhirMaterialiseJob.lockAndRun(() => {});
      await FhirMaterialiseJob.enqueue(job);
      await FhirMaterialiseJob.lockAndRun(() => {
        throw new Error('test error');
      });
      await FhirMaterialiseJob.enqueue(job);
      await FhirMaterialiseJob.lockAndRun(() => {
        throw new Error('test error 2');
      });
      await FhirMaterialiseJob.enqueue(job);
      await FhirMaterialiseJob.enqueue(job);

      // assert
      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(4);
      expect(found.map(f => f.status).sort()).toEqual([
        'Completed',
        'Errored',
        'Errored',
        'Queued',
      ]);
    });
  });
  describe('lockAndRun', () => {
    it('runs queued jobs', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job = { upstreamId: 'up4', resource: 'r4' };
      await FhirMaterialiseJob.enqueue(job);

      // act
      let ran = false;
      let recievedJob = null;
      const [completed, failed] = await FhirMaterialiseJob.lockAndRun(j => {
        ran = true;
        recievedJob = j;
      });

      // assert
      expect(recievedJob.upstreamId).toEqual(job.upstreamId);
      expect(recievedJob.resource).toEqual(job.resource);
      expect(completed).toHaveLength(1);
      expect(failed).toHaveLength(0);
      expect(ran).toEqual(true);

      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        ...job,
        status: 'Completed',
        startedAt: expect.any(Date),
        completedAt: expect.any(Date),
        erroredAt: null,
        error: null,
      });
    });

    it('retries already queued jobs after a timeout', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job1 = { upstreamId: 'up5', resource: 'r5' };
      const job2 = { upstreamId: 'up6', resource: 'r6' };
      await FhirMaterialiseJob.create({
        ...job1,
        status: 'Started',
        startedAt: new Date(2020, 1, 1),
      });
      await FhirMaterialiseJob.create({
        ...job2,
        status: 'Started',
        startedAt: new Date(),
      });

      // act
      let ran = false;
      const [completed, failed] = await FhirMaterialiseJob.lockAndRun(() => {
        ran = true;
      });

      // assert
      expect(ran).toEqual(true);
      expect(completed).toHaveLength(1);
      expect(failed).toHaveLength(0);

      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(2);
      expect(found.map(f => f.status).sort()).toEqual(['Completed', 'Started']);
    });

    it('records errors', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job = { upstreamId: 'up7', resource: 'r7' };
      await FhirMaterialiseJob.enqueue(job);

      // act
      const [completed, failed] = await FhirMaterialiseJob.lockAndRun(() => {
        throw new Error('test that this error is recorded');
      });

      // assert
      expect(completed).toHaveLength(0);
      expect(failed).toHaveLength(1);

      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        ...job,
        error: expect.stringMatching('test that this error is recorded'),
        erroredAt: expect.any(Date),
        status: 'Errored',
      });
    });

    it('only runs <limit> jobs', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job1 = { upstreamId: 'up8', resource: 'r8' };
      const job2 = { upstreamId: 'up9', resource: 'r9' };
      const job3 = { upstreamId: 'up10', resource: 'r10' };
      await FhirMaterialiseJob.enqueueMultiple([job1, job2, job3]);

      // act
      let runs = 0;
      const [completed, failed] = await FhirMaterialiseJob.lockAndRun(() => {
        runs += 1;
      });

      // assert
      expect(runs).toEqual(2);
      expect(completed).toHaveLength(2);
      expect(failed).toHaveLength(0);

      const found = await FhirMaterialiseJob.findAll({ where: {} }, { raw: true });
      expect(found).toHaveLength(3);
      expect(found.map(f => f.status).sort()).toEqual(['Completed', 'Completed', 'Queued']);
    });
  });

  describe('countQueued', () => {
    it('counts queued jobs, including retriable ones', async () => {
      // arrange
      const { FhirMaterialiseJob } = ctx.store.models;
      const job1 = { upstreamId: 'up11', resource: 'r11' };
      const job2 = { upstreamId: 'up12', resource: 'r12' };
      const job3 = { upstreamId: 'up13', resource: 'r13' };
      await FhirMaterialiseJob.create({
        ...job1,
        status: 'Started',
        startedAt: new Date(2020, 1, 1),
      });
      await FhirMaterialiseJob.create({
        ...job2,
        status: 'Started',
        startedAt: new Date(),
      });
      await FhirMaterialiseJob.enqueue(job3);

      // act
      const count = await FhirMaterialiseJob.countQueued();

      // assert
      expect(count).toEqual(2);
    });
  });
});
