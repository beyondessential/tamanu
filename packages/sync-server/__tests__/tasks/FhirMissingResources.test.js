import { fake } from 'shared/test-helpers';
import { Op } from 'sequelize';
import { IMAGING_REQUEST_STATUS_TYPES, NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fakeResourcesOfFhirServiceRequest } from '../testData/fhir';
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
      NotePage,
      NoteItem,
      FhirServiceRequest,
    } = ctx.store.models;

    fhirMissingResourcesWorker = new FhirMissingResources(ctx);
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

    const [np1, np2] = await NotePage.bulkCreate([
      fake(NotePage, {
        date: '2022-03-05',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        noteType: NOTE_TYPES.OTHER,
        recordType: ImagingRequest.name,
        recordId: imagingRequest.id,
      }),
      fake(NotePage, {
        date: '2022-03-06',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        noteType: NOTE_TYPES.OTHER,
        recordType: ImagingRequest.name,
        recordId: imagingRequest.id,
      }),
    ]);
    await NoteItem.bulkCreate([
      fake(NoteItem, { notePageId: np1.id, content: 'Suspected adenoma' }),
      fake(NoteItem, { notePageId: np1.id, content: 'Patient may need mobility assistance' }),
      fake(NoteItem, {
        notePageId: np2.id,
        content: 'Patient may have shrapnel in leg - need to confirm beforehand',
      }),
    ]);

    await imagingRequest.setAreas([resources.area1.id, resources.area2.id]);
    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.resolveUpstreams();
  });

  afterAll(() => {
    ctx.close();
  });

  it('should create a FHIR resource if it is missing', async () => {
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
