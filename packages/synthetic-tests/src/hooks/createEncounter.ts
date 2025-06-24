import { getRandomPatient } from '../utils/getRandomPatient';
import { fakeCreateEncounterRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createEncounter';
import { getRandomLocation } from '../utils/getRandomLocation';
import { getRandomDepartment } from '../utils/getRandomDepartment';

/**
 * Generates a payload for creating an encounter by:
 * 1. Retrieving a random patient from the backend API
 * 2. Creating an encounter payload with required fields using fake data
 * 3. Storing the payload and selected patient in the context
 *
 * @param context - The test context containing variables and state
 * @param _events - Unused events parameter
 * @returns Promise that resolves when the payload is generated
 *
 * Required context variables:
 * - baseUrl: Base URL of the facility server
 * - token: Authentication token
 * - userId: ID of the user creating the encounter
 * - facilityId: Facility ID for filtering patients
 *
 * Optional context variables:
 * - locationId: Specific location ID (falls back to patient's location)
 * - departmentId: Specific department ID (falls back to patient's department)
 *
 * Outputs:
 * - encounterPayload: Generated encounter payload for Artillery to use
 * - selectedPatient: The randomly selected patient
 *
 * @example
 * ```typescript
 * await generateEncounterPayload(context, events);
 * console.log('Encounter payload:', context.vars.encounterPayload);
 * console.log('Selected patient:', context.vars.selectedPatient);
 * ```
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
