/**
 * Tests for sortResourcesInDependencyOrder and the resolver job entrypoint
 * (source: @tamanu/shared/tasks). Run here in central-server so we avoid a
 * circular devDependency between shared and database.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { resolver, sortResourcesInDependencyOrder } from '@tamanu/shared/tasks';
import { createTestContext } from '../../utilities';
import { fakeResourcesOfFhirServiceRequest } from '../../fake/fhir';
import { FHIR_INTERACTIONS } from '@tamanu/constants';

// Mock out sleepAsync so we don't have to wait for the resolver's built-in delay.
const sleepAsyncMock = vi.fn();
vi.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: ms => sleepAsyncMock(ms),
}));

describe('sortResourcesInDependencyOrder', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext({ initFhir: true });
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  it('should sort resources in dependency order', () => {
    const materialisableResources = resourcesThatCanDo(
      models,
      FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    );
    const sorted = sortResourcesInDependencyOrder(materialisableResources);

    expect(sorted.map(r => r.name)).toEqual([
      'FhirOrganization',
      'FhirPatient',
      'FhirPractitioner',
      'FhirSpecimen',
      'MediciReport',
      'FhirEncounter',
      'FhirImmunization',
      'FhirServiceRequest',
      'FhirMedicationRequest',
    ]);
  });
});

describe('resolver job', () => {
  let ctx;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext({ initFhir: true });
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
  });

  afterAll(() => ctx.close());

  it('runs end-to-end using the settings reader, resolving materialised resources', async () => {
    const {
      FhirServiceRequest,
      FhirEncounter,
      FhirOrganization,
      FhirPractitioner,
      ImagingRequest,
    } = ctx.store.models;

    const ir = await ImagingRequest.create(
      fake(ImagingRequest, {
        requestedById: resources.practitioner.id,
        encounterId: resources.encounter.id,
        locationGroupId: resources.locationGroup.id,
      }),
    );
    const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
    await FhirOrganization.materialiseFromUpstream(resources.facility.id);
    await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
    await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);
    expect(mat.resolved).toBe(false);

    await resolver(undefined, { log, models: ctx.store.models, settings: ctx.settings });

    await mat.reload();
    expect(mat.resolved).toBe(true);
  });
});
