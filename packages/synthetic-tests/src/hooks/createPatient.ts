import { fakeCreatePatientRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createPatient';

export async function generatePatientPayload(context: any, _events: any): Promise<void> {
  const testBody = fakeCreatePatientRequestBody(
    {
      facilityId: context.vars.facilityId,
      registeredById: context.vars.userId,
    },
    {
      patientRegistryType: 'new_patient',
    },
  );

  context.vars.patientPayload = testBody;
}
