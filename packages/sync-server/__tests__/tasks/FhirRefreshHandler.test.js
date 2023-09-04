import { fake } from 'shared/test-helpers';
import { log } from 'shared/services/logging';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fakeResourcesOfFhirServiceRequest } from '../fake/fhir';
import { allFromUpstream } from '../../app/tasks/fhir/refresh/allFromUpstream';

describe('FHIR refresh handler', () => {
  let ctx;
  let resources;
  let imagingRequest;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { FhirEncounter, ImagingRequest } = ctx.store.models;

    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);

    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

    imagingRequest = await ImagingRequest.create(
      fake(ImagingRequest, {
        requestedById: resources.practitioner.id,
        encounterId: resources.encounter.id,
        locationGroupId: resources.locationGroup.id,
        status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
        priority: 'routine',
        requestedDate: '2022-03-04 15:30:00',
        imagingType: 'xRay',
      }),
    );

    await imagingRequest.setAreas([resources.area1.id, resources.area2.id]);
  });

  describe('allFromUpstream', () => {
    beforeEach(async () => {
      await ctx.store.models.FhirJob.destroy({ where: {} });
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
        },
      });

      expect(count).toEqual(0);
      expect(rows).toEqual([]);
      await encounter.destroy();
    });
  });
});
