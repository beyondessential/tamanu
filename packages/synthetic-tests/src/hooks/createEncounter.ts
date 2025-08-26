import { fakeCreateEncounterRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createEncounter';

/**
 * Generates an encounter payload with a random patient, location, and department.
 * Stores the payload and selected patient in context.vars.
 */
export async function generateEncounterPayload(context: any, _events: any): Promise<void> {
  const { entityFetcher } = context.vars;
  // Get a random patient
  const randomPatient = await entityFetcher.getRandom('patient');
  const randomLocation = await entityFetcher.getRandom('location');
  const randomDepartment = await entityFetcher.getRandom('department');

  // Create encounter payload using fake data
  const encounterPayload = fakeCreateEncounterRequestBody({
    required: {
      patientId: randomPatient.id,
      examinerId: context.vars.userId,
      locationId: context.vars.locationId || randomLocation.id,
      departmentId: context.vars.departmentId || randomDepartment.id,
    },
    overrides: {
      reasonForEncounter: 'Synthetic test encounter',
    },
  });

  context.vars.encounterPayload = encounterPayload;
  context.vars.selectedPatient = randomPatient;
}
