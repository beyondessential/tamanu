import { fakeCreatePatientRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createPatient';

/**
 * Generates a patient payload with a random facility and registered by user.
 * Stores the payload in context.vars.patientPayload.
 */
export async function generatePatientPayload(context: any, _events: any): Promise<void> {
  const testBody = fakeCreatePatientRequestBody({
    required: {
      facilityId: context.vars.facilityId,
      registeredById: context.vars.userId,
    },
    overrides: {
      patientRegistryType: 'new_patient',
    },
  });

  context.vars.patientPayload = testBody;
}
