import { Op } from 'sequelize';
import config from 'config';
import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

async function fetchMostRecentEmailAddress(patientId, models) {
  const questionId = config?.questionCodeIds?.email;
  if (!questionId) {
    return null;
  }

  // Find the most recent non-empty answer to the question
  const answer = await models.SurveyResponseAnswer.findOne({
    include: {
      model: models.SurveyResponse,
      as: 'surveyResponse',
      include: { model: models.Encounter, where: { patientId }, as: 'encounter' },
    },
    where: {
      data_element_id: questionId,
      [Op.not]: [{ body: '' }],
    },
    order: [[{ model: models.SurveyResponse, as: 'surveyResponse' }, 'end_time', 'DESC']],
  });
  return answer?.body;
}

export async function createLabRequestNotifications(labRequest, models) {
  if (
    labRequest.labTestCategoryId === config?.notifications?.certificates?.labTestCategoryId &&
    labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED
  ) {
    const encounter = await models.Encounter.findOne({ where: { id: labRequest.encounterId } });

    // Bulk create action sets off a hook to send these out
    await models.CertificateNotification.bulkCreate([
      {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING,
        requiresSigning: false,
        patientId: encounter.patientId,
        // If forward address is null, the communication service will attempt to use the patient.email field
        forwardAddress: await fetchMostRecentEmailAddress(encounter.patientId, models),
      },
    ]);
  }
}
