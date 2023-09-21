import { fake } from 'shared/test-helpers';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fhir } from '../../app/subCommands/fhir';
import { ApplicationContext } from '../../app/ApplicationContext';
import { fakeResourcesOfFhirServiceRequest } from '../fake/fhir';

describe('fhir sub commands', () => {
  let ctx;
  let resources;
  let imagingRequest;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { FhirEncounter, ImagingRequest, FhirServiceRequest } = ctx.store.models;
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
    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.resolveUpstreams();

    jest
      .spyOn(ApplicationContext.prototype, 'close')
      .mockImplementation(() => 'do not close database at the end of the fhir subcommand');
  });

  afterAll(async () => {
    await ctx.close();
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
