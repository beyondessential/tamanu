import config from 'config';
import { getPatientSurveyResponseAnswer } from '../utils';
import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

export async function createSingleLabRequestNotification(labRequest, models) {
  if (
    config?.notifications?.certificates?.labTestCategoryIds?.includes(
      labRequest.labTestCategoryId,
    ) &&
    labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED
  ) {
    const encounter = await models.Encounter.findByPk(labRequest.encounterId);

    const questionId = config?.questionCodeIds?.email;
    const emailAddress = await getPatientSurveyResponseAnswer(
      models,
      encounter.patientId,
      questionId,
    );

    // Bulk create action sets off a hook to send these out
    await models.CertificateNotification.bulkCreate([
      {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
        requiresSigning: false,
        patientId: encounter.patientId,
        // If forward address is null, the communication service will attempt to use the patient.email field
        forwardAddress: emailAddress,
      },
    ]);
  }
}

export async function createMultiLabRequestNotifications(labRequests, models) {
  for (const request of labRequests) {
    await createSingleLabRequestNotification(request, models);
  }
}
