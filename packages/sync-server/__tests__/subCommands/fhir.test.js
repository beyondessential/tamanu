import { fake } from 'shared/test-helpers';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
  FHIR_REQUEST_STATUS,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fhir } from '../../app/subCommands/fhir';
import { ApplicationContext } from '../../app/ApplicationContext';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../fake/fhir';

describe('fhir sub commands', () => {
  let ctx;
  let resources;
  let imagingRequest;
  let labRequest;

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

    labRequest = (
      await fakeResourcesOfFhirServiceRequestWithLabRequest(ctx.store.models, resources)
    ).labRequest;

    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
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
    await imagingRequest.update({ status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS });

    await fhir({ refresh: 'ServiceRequest' });

    await fhirServiceRequest.reload();
    // See mapping at packages/shared/src/models/fhir/ServiceRequest/getValues.js
    expect(fhirServiceRequest.status).toEqual(FHIR_REQUEST_STATUS.ACTIVE);
  });

  it('should catch when multiple Upstream models get updated', async () => {
    const { FhirServiceRequest } = ctx.store.models;
    const fhirImagingServiceRequest = await FhirServiceRequest.findOne({
      where: {
        upstreamId: imagingRequest.id,
      },
    });
    const fhirLabServiceRequest = await FhirServiceRequest.findOne({
      where: {
        upstreamId: labRequest.id,
      },
    });

    await imagingRequest.update({ status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS });
    await labRequest.update({ status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED });

    await fhir({ refresh: 'ServiceRequest' });

    await fhirImagingServiceRequest.reload();
    await fhirLabServiceRequest.reload();
    // See mapping at packages/shared/src/models/fhir/ServiceRequest/getValues.js
    expect(fhirImagingServiceRequest.status).toEqual(FHIR_REQUEST_STATUS.ACTIVE);
    expect(fhirLabServiceRequest.status).toEqual(FHIR_REQUEST_STATUS.ACTIVE);
  });

  it('should not update those upstream records that do not meet pre filter criteria', async () => {
    const { Encounter, FhirEncounter } = ctx.store.models;
    // new encounter with different encounter type that do not meet pre filter criteria
    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId: resources.patient.id,
        locationId: resources.location.id,
        departmentId: resources.department.id,
        examinerId: resources.practitioner.id,
        encounterType: 'surveyResponse',
      }),
    );

    await fhir({ refresh: 'Encounter' });
    const fhirEncounter = await FhirEncounter.findAndCountAll({
      where: {},
    });

    expect(fhirEncounter.count).toEqual(1);
    expect(fhirEncounter.rows[0].upstreamId).toEqual(resources.encounter.id);
    await encounter.destroy();
  });
});
