import { getRandomPatient } from '../utils/getRandomPatient';
import { fakeCreateEncounterRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createEncounter';
import { getRandomLocation } from '../utils/getRandomLocation';
import { getRandomDepartment } from '../utils/getRandomDepartment';

/**
 * Generates an encounter payload with a random patient, location, and department.
 * Stores the payload and selected patient in context.vars.
 */
export async function generateEncounterPayload(context: any, _events: any): Promise<void> {
  const { target, token, facilityId } = context.vars;
  // Get a random patient
  const randomPatient = await getRandomPatient(target, token, facilityId);

  const randomLocation = await getRandomLocation(target, token, facilityId);
  const randomDepartment = await getRandomDepartment(target, token, facilityId);

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
