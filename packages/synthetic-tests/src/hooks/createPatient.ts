import { fakeCreatePatientRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createPatient';

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
