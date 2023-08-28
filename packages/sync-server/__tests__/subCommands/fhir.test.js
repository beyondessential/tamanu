import { fake } from 'shared/test-helpers';
import { IMAGING_REQUEST_STATUS_TYPES, NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fhir } from '../../app/subCommands/fhir';
import { ApplicationContext } from '../../app/ApplicationContext';
import { fakeResourcesOfFhirServiceRequest } from '../testData/fhir';

describe('fhir sub commands', () => {
  let ctx;
  let resources;
  let imagingRequest;

  beforeAll(async () => {
    ctx = await createTestContext();
    const {
      FhirEncounter,
      ImagingRequest,
      NotePage,
      NoteItem,
      FhirServiceRequest,
    } = ctx.store.models;
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

    jest
      .spyOn(ApplicationContext.prototype, 'close')
      .mockImplementation(() => 'do not close database at the end of the fhir subcommand');
  });

  afterAll(() => {
    ctx.close();
    jest.clearAllMocks();
  });

  it('should refresh a FHIR resource to get updated from upstream', async () => {
    const { FhirServiceRequest } = ctx.store.models;
    const fhirServiceRequest = await FhirServiceRequest.findOne({
      where: {
        upstreamId: imagingRequest.id,
      },
    });
    await fhirServiceRequest.update({ status: IMAGING_REQUEST_STATUS_TYPES.CANCELLED });

    await fhir({ refresh: 'ServiceRequest' });

    await fhirServiceRequest.reload();
    expect(fhirServiceRequest.status).toEqual(IMAGING_REQUEST_STATUS_TYPES.COMPLETED);
  });
});
