import { fakeCreateEncounterRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createEncounter';

/**
 * Generates an encounter payload with a random patient, location, and department.
 * Stores the payload and selected patient in context.vars.
 */
export async function generateEncounterPayload(context: any, _events: any): Promise<void> {
  const { entityFetcher } = context.vars;

  const [randomPatient, randomLocation, randomDepartment] = await Promise.all([
    entityFetcher.getRandom('patient'),
    entityFetcher.getRandom('location'),
    entityFetcher.getRandom('department'),
  ]);

  const encounterPayload = fakeCreateEncounterRequestBody({
    patientId: randomPatient.id,
    examinerId: context.vars.userId,
    locationId: randomLocation.id,
    departmentId: randomDepartment.id,
  });

  context.vars.encounterPayload = encounterPayload;
  context.vars.selectedPatient = randomPatient;
}
