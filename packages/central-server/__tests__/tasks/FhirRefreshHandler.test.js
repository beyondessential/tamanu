import { Op } from 'sequelize';
import { JOB_PRIORITIES } from '@tamanu/constants';

import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging';

import { createTestContext } from '../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
} from '../fake/fhir';
import { allFromUpstream } from '../../app/tasks/fhir/refresh/allFromUpstream';
import { entireResource } from '../../app/tasks/fhir/refresh/entireResource';

describe('FHIR refresh handler', () => {
  let ctx;
  let resources;
  let imagingRequest;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { FhirEncounter, FhirServiceRequest } = ctx.store.models;

    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);

    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

    imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
      ctx.store.models,
      resources,
    );

    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
  });

  afterAll(() => ctx.close());

  describe('allFromUpstream', () => {
    beforeEach(async () => {
      await ctx.store.models.FhirJob.truncate({ force: true });
    });

    it('finds all the FHIR resources that need to be updated', async () => {
      await allFromUpstream(
        {
          payload: {
            op: 'UPDATE',
            table: 'public.encounters',
            id: resources.encounter.id,
          },
        },
        {
          log,
          sequelize: ctx.store.sequelize,
          models: ctx.store.models,
        },
      );

      const { count, rows } = await ctx.store.models.FhirJob.findAndCountAll({
        where: {
          topic: 'fhir.refresh.fromUpstream',
          payload: {
            resource: {
              [Op.ne]: 'MediciReport',
            },
          },
        },
      });

      expect(count).toEqual(2);
      expect(rows).toEqual([
        expect.objectContaining({
          payload: expect.objectContaining({
            op: 'UPDATE',
            resource: 'Encounter',
            table: 'public.encounters',
            upstreamId: resources.encounter.id,
          }),
        }),
        expect.objectContaining({
          payload: expect.objectContaining({
            op: 'UPDATE',
            resource: 'ServiceRequest',
            table: 'public.encounters',
            upstreamId: imagingRequest.id,
          }),
        }),
      ]);
    });

    it('does not create a job if the upstream do not meet the filter criteria', async () => {
      const { Encounter } = ctx.store.models;

      const encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
          encounterType: 'surveyResponse',
        }),
      );

      await allFromUpstream(
        {
          payload: {
            op: 'UPDATE',
            table: 'public.encounters',
            id: encounter.id,
          },
        },
        {
          log,
          sequelize: ctx.store.sequelize,
          models: ctx.store.models,
        },
      );

      const { count, rows } = await ctx.store.models.FhirJob.findAndCountAll({
        where: {
          topic: 'fhir.refresh.fromUpstream',
          payload: {
            resource: {
              [Op.ne]: 'MediciReport', // excluding created MediciReport job as it doesn't ignore SurveyResponses
            },
          },
        },
      });

      expect(count).toEqual(0);
      expect(rows).toEqual([]);
      await encounter.destroy();
    });

    it('propagates parent job priority to child refresh jobs', async () => {
      await allFromUpstream(
        {
          payload: {
            op: 'UPDATE',
            table: 'public.encounters',
            id: resources.encounter.id,
          },
          priority: JOB_PRIORITIES.MIGRATION,
        },
        {
          log,
          sequelize: ctx.store.sequelize,
          models: ctx.store.models,
        },
      );

      const rows = await ctx.store.models.FhirJob.findAll({
        where: {
          topic: 'fhir.refresh.fromUpstream',
          payload: {
            resource: {
              [Op.ne]: 'MediciReport',
            },
          },
        },
      });

      expect(rows).not.toEqual([]);
      expect(rows.every(row => row.priority === JOB_PRIORITIES.MIGRATION)).toBe(true);
    });
  });

  describe('entireResource', () => {
    beforeEach(async () => {
      await ctx.store.models.FhirJob.destroy({ where: {} });
    });

    it('propagates parent job priority to child refresh jobs', async () => {
      await entireResource(
        {
          payload: { resource: 'Encounter' },
          priority: JOB_PRIORITIES.MIGRATION,
        },
        {
          log,
          sequelize: ctx.store.sequelize,
          models: ctx.store.models,
        },
      );

      const rows = await ctx.store.models.FhirJob.findAll({
        where: {
          topic: 'fhir.refresh.fromUpstream',
          payload: { resource: 'Encounter' },
        },
      });

      expect(rows).not.toEqual([]);
      expect(rows.every(row => row.priority === JOB_PRIORITIES.MIGRATION)).toBe(true);
    });
  });

  describe('refresh trigger priority', () => {
    beforeEach(async () => {
      await ctx.store.models.FhirJob.destroy({ where: {} });
      await ctx.store.sequelize.query(`DROP TABLE IF EXISTS public.test_fhir_refresh_priority;`);
      await ctx.store.sequelize.query(`
        CREATE TABLE public.test_fhir_refresh_priority (
          id TEXT PRIMARY KEY
        );
      `);
      await ctx.store.sequelize.query(`
        CREATE TRIGGER fhir_refresh_test_fhir_refresh_priority
        AFTER INSERT OR UPDATE OR DELETE ON public.test_fhir_refresh_priority FOR EACH ROW
        EXECUTE FUNCTION fhir.refresh_trigger();
      `);
    });

    afterEach(async () => {
      await ctx.store.sequelize.query(`DROP TABLE IF EXISTS public.test_fhir_refresh_priority;`);
    });

    it('uses lower priority when migration context is set', async () => {
      // set_config(..., true) is SET LOCAL: it only lasts for the current transaction.
      await ctx.store.sequelize.transaction(async () => {
        await ctx.store.sequelize.query(
          `SELECT set_config('tamanu.audit.migration_context', '{"test":"context"}', true)`,
        );
        await ctx.store.sequelize.query(
          `INSERT INTO public.test_fhir_refresh_priority (id) VALUES ('with-context')`,
        );
      });

      const job = await ctx.store.models.FhirJob.findOne({
        where: { topic: 'fhir.refresh.allFromUpstream' },
        order: [['createdAt', 'DESC']],
      });

      expect(job).toBeTruthy();
      expect(job.priority).toBe(JOB_PRIORITIES.MIGRATION);
    });

    it('uses default priority when migration context is not set', async () => {
      await ctx.store.sequelize.query(`
        INSERT INTO public.test_fhir_refresh_priority (id) VALUES ('without-context');
      `);

      const job = await ctx.store.models.FhirJob.findOne({
        where: { topic: 'fhir.refresh.allFromUpstream' },
        order: [['createdAt', 'DESC']],
      });

      expect(job).toBeTruthy();
      expect(job.priority).toBe(JOB_PRIORITIES.DEFAULT);
    });
  });
});
