import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import {
  initFhirSettingsFromDb,
  resetFhirSettingsCache,
} from '@tamanu/shared/utils/fhir/fhirSettingsCache';
import { sortResourcesInDependencyOrder } from '../../../dist/tasks/fhir/resolver';
import { createTestContext } from '../../utilities';
import { FHIR_INTERACTIONS, SETTINGS_SCOPES } from '@tamanu/constants';

describe('sortResourcesInDependencyOrder', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    await models.Setting.set(
      'fhir.worker.resourceMaterialisationEnabled',
      {
        Patient: true,
        Encounter: true,
        Immunization: true,
        MediciReport: true,
        Organization: true,
        Practitioner: true,
        ServiceRequest: true,
        Specimen: true,
        MedicationRequest: true,
        DiagnosticReport: true,
      },
      SETTINGS_SCOPES.GLOBAL,
    );
    await initFhirSettingsFromDb(models);
  });

  afterAll(async () => {
    resetFhirSettingsCache();
    await ctx.close();
  });

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
