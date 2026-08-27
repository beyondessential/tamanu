import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  FHIR_REQUEST_STATUS,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fhirCommand } from '../../app/subCommands/fhir';
import { ApplicationContext } from '../../app/ApplicationContext';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../fake/fhir';

describe('fhir sub commands', () => {
  let ctx;
  let resources;
  let imagingRequest;
  let labRequest;

  beforeAll(async () => {
    ctx = await createTestContext({ initFhir: true });
    const { FhirEncounter, FhirServiceRequest } = ctx.store.models;
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);

    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

    imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
      ctx.store.models,
      resources,
    );

    labRequest = (
      await fakeResourcesOfFhirServiceRequestWithLabRequest(ctx.store.models, resources)
    ).labRequest;

    await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
    await FhirServiceRequest.resolveUpstreams();

    // Use the test context when the command creates an ApplicationContext, so we avoid
    // a second initDatabase() and concurrent use of the same DB (which can hang in CI).
    // Return a context-shaped object with the test store and a no-op close so the command
    // never closes the test DB.
    vi.spyOn(ApplicationContext.prototype, 'init').mockResolvedValue({
      store: ctx.store,
      close: () => Promise.resolve(),
    });
  });

  afterAll(async () => {
    await ctx.close();
    vi.restoreAllMocks();
  });

  it('should refresh a FHIR resource to get updated from upstream', async () => {
    const { FhirServiceRequest } = ctx.store.models;
    const fhirServiceRequest = await FhirServiceRequest.findOne({
      where: {
        upstreamId: imagingRequest.id,
      },
    });
    await imagingRequest.update({ status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS });

    await fhirCommand.parseAsync(['node', 'fhir', '--refresh', 'ServiceRequest']);

    await fhirServiceRequest.reload();
    // See mapping at packages/database/src/models/fhir/ServiceRequest/getValues.js
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

    await fhirCommand.parseAsync(['node', 'fhir', '--refresh', 'ServiceRequest']);

    await fhirImagingServiceRequest.reload();
    await fhirLabServiceRequest.reload();
    // See mapping at packages/database/src/models/fhir/ServiceRequest/getValues.js
    expect(fhirImagingServiceRequest.status).toEqual(FHIR_REQUEST_STATUS.ACTIVE);
    expect(fhirLabServiceRequest.status).toEqual(FHIR_REQUEST_STATUS.ACTIVE);
  });
});
