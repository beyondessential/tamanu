import { fake } from 'shared/test-helpers';
import { Op } from 'sequelize';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fakeResourcesOfFhirServiceRequest } from '../fake/fhir';
import { FhirMissingResources } from '../../app/tasks/FhirMissingResources';

describe('FhirMissingResources task', () => {
  let ctx;
  let resources;
  let imagingRequest;
  let fhirMissingResourcesWorker;

  beforeAll(async () => {
    ctx = await createTestContext();
    const {
      FhirEncounter,
      ImagingRequest,
      FhirServiceRequest,
      FhirPractitioner,
    } = ctx.store.models;

    fhirMissingResourcesWorker = new FhirMissingResources(ctx);
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);

    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
    await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);

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
    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.resolveUpstreams();
  });

  afterAll(() => ctx.close());

  it('should create one FHIR fromUpstream job if a FHIR resource is missing', async () => {
    const { FhirServiceRequest, FhirJob } = ctx.store.models;
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
});
