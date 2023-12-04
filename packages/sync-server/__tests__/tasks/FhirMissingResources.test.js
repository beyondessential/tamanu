import { fake } from '@tamanu/shared/test-helpers';
import { Op } from 'sequelize';
import { createTestContext } from '../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
} from '../fake/fhir';
import { FhirMissingResources } from '../../app/tasks/FhirMissingResources';

describe('FhirMissingResources task', () => {
  let ctx;
  let resources;
  let fhirMissingResourcesWorker;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { FhirEncounter, FhirPractitioner } = ctx.store.models;

    fhirMissingResourcesWorker = new FhirMissingResources(ctx);
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);

    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
    await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);
  });

  beforeEach(async () => {
    const { FhirJob, FhirServiceRequest, ImagingRequest } = ctx.store.models;
    await FhirJob.destroy({ where: {} });
    await FhirServiceRequest.destroy({ where: {} });
    await ImagingRequest.destroy({ where: {} });
  });

  afterAll(() => {
    ctx.close();
  });

  it('should create one FHIR fromUpstream job if a FHIR resource is missing', async () => {
    const { FhirServiceRequest, FhirJob } = ctx.store.models;
    const imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
      ctx.store.models,
      resources,
    );
    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.resolveUpstreams();

    const fhirServiceRequest = await FhirServiceRequest.findOne({
      where: {
        upstreamId: imagingRequest.id,
      },
    });
    await fhirServiceRequest.destroy();

    const name = fhirMissingResourcesWorker.getName();
    expect(name).toEqual('FhirMissingResources');
    const countQueue = await fhirMissingResourcesWorker.countQueue();
    expect(countQueue).toEqual(1);
    await fhirMissingResourcesWorker.run();

    const fhirJob = await FhirJob.findOne({
      where: {
        topic: 'fhir.refresh.fromUpstream',
        payload: {
          upstreamId: {
            [Op.eq]: imagingRequest.id,
          },
        },
      },
    });

    expect(fhirJob.payload).toEqual({
      resource: 'ServiceRequest',
      upstreamId: imagingRequest.id,
    });
  });

  it('should not create one FHIR fromUpstream job if the missing upstream resource do not meet pre-filter criteria', async () => {
    const { Encounter, FhirJob } = ctx.store.models;
    await fhirMissingResourcesWorker.run();

    // A new encounter That should not be materialised
    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId: resources.patient.id,
        locationId: resources.location.id,
        departmentId: resources.department.id,
        examinerId: resources.practitioner.id,
        encounterType: 'surveyResponse',
      }),
    );

    const countQueue = await fhirMissingResourcesWorker.countQueue();
    expect(countQueue).toEqual(0);
    await fhirMissingResourcesWorker.run();

    const fhirJob = await FhirJob.findOne({
      where: {
        topic: 'fhir.refresh.fromUpstream',
      },
    });

    expect(fhirJob).toBeNull();
    await encounter.destroy();
  });
});
