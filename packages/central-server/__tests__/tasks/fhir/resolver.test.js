import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { sortResourcesInDependencyOrder } from '../../../dist/tasks/fhir/resolver';
import { createTestContext } from '../../utilities';
import { FHIR_INTERACTIONS } from '@tamanu/constants';

describe('sortResourcesInDependencyOrder', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
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
    ]);
  });
});
