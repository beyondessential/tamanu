import { fake } from '@tamanu/shared/test-helpers';
import { Op } from 'sequelize';
import { createTestContext } from '../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
  fakeResourcesOfFhirSpecimen,
} from '../fake/fhir';
import { FhirMissingResources } from '../../dist/tasks/FhirMissingResources';
import { JOB_PRIORITIES } from '@tamanu/constants';


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
    const { FhirJob, FhirServiceRequest, FhirSpecimen, ImagingRequest } = ctx.store.models;
    await FhirJob.truncate();
    await FhirServiceRequest.truncate();
    await FhirSpecimen.truncate();
    await ImagingRequest.truncate();
  });

  afterAll(() => {
    ctx.close();
  });

  // There's always going to be 1 Practitioner's job in the queue as the system user is created

  it('should create jobs with low priority', async () => {
    const { FhirJob } = ctx.store.models;

    const { labRequest } = await fakeResourcesOfFhirSpecimen(ctx.store.models, resources);

    await fhirMissingResourcesWorker.run();

    const { count, rows } = await FhirJob.findAndCountAll({
      where: {
        topic: 'fhir.refresh.fromUpstream',
      },
    });

    expect(count).toEqual(4); // 1 Organization, 1 ServiceRequest, 1 Specimen, 1 Practitioner
    rows.forEach(job => expect(job.priority).toEqual(JOB_PRIORITIES.LOW));

    await labRequest.destroy();
  });

  it('should create FHIR fromUpstream jobs if FHIR resource are missing', async () => {
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
    expect(countQueue).toEqual(3); // 1 Practitioner, 1 MediciReport AND 1 ServiceRequest
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
    expect(countQueue).toEqual(2); // 1 Practitioner, 1 Encounter
    await fhirMissingResourcesWorker.run();

    const fhirJob = await FhirJob.findOne({
      where: {
        topic: 'fhir.refresh.fromUpstream',
        payload: {
          resource: {
            [Op.notIn]: ['Practitioner', 'Organization'],
          },
        },
      },
    });

    expect(fhirJob).toBeNull();
    await encounter.destroy();
  });

  it('should only create FHIR fromUpstream job if the missing upstream resource was created after the created_after setting', async () => {
    const { FhirJob } = ctx.store.models;

    const { labRequest: oldLabRequest } = await fakeResourcesOfFhirSpecimen(
      ctx.store.models,
      resources,
      {
        createdAt: '2020-01-01T00:00:00.000Z',
      },
    );

    const { labRequest: newLabRequest } = await fakeResourcesOfFhirSpecimen(
      ctx.store.models,
      resources,
      {
        createdAt: '2020-01-03T00:00:00.000Z',
      },
    );

    const created_after = '2020-01-02T00:00:00.000Z';

    const fhirMissingResourcesCreatedAfterWorker = new FhirMissingResources(ctx, {
      created_after,
    });

    const countQueue = await fhirMissingResourcesCreatedAfterWorker.countQueue();
    expect(countQueue).toEqual(4); // 1 Practitioner, 1 Organization, 1 ServiceRequest, 1 Specimen
    await fhirMissingResourcesCreatedAfterWorker.run();

    const { count, rows } = await FhirJob.findAndCountAll({
      where: {
        topic: 'fhir.refresh.fromUpstream',
        payload: {
          resource: {
            [Op.notIn]: ['Practitioner', 'Organization'],
          },
        },
      },
    });

    expect(count).toEqual(2);
    rows.forEach(job => expect(job.payload.upstreamId).toEqual(newLabRequest.id));

    await oldLabRequest.destroy();
    await newLabRequest.destroy();
  });
});
