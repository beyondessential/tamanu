import config from 'config';
import { getPatientSurveyResponseAnswer } from '../utils';
import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

async function createLabRequestNotification(labRequest, models) {
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
      // TODO: attach lab test
    },
  ]);
}

export async function createLabRequestUpdateNotification(labRequest, models) {
  if (
    labRequest._changed.status &&
    config?.notifications?.certificates?.labTestCategoryIds?.includes(
      labRequest.labTestCategoryId,
    ) &&
    labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED
  ) {
    createLabRequestNotification(labRequest, models);
  }
}

export async function createLabRequestCreateNotification(labRequests, models) {
  for (const request of labRequests) {
    if (
      request.labTestCategoryId === config?.notifications?.certificates?.labTestCategoryId &&
      request.status === LAB_REQUEST_STATUSES.PUBLISHED
    ) {
      createLabRequestNotification(request, models);
    }
  }
}
