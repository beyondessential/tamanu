import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

async function fetchMostRecentEmailAddress(patientId, models) {
  const surveyQuestion = 'pde-FijCOVRDT008'; // TODO: fetch this from somewhere
  const answer = await models.SurveyResponseAnswer.findOne({
    include: {
      model: models.SurveyResponse,
      as: 'surveyResponse',
      include: { model: models.Encounter, where: { patientId }, as: 'encounter' },
    },
    where: { data_element_id: surveyQuestion },
    order: [['created_at', 'DESC']],
  });

  return answer;
}

export async function createLabRequestNotifications(labRequest, models) {
  if (
    labRequest.labTestCategoryId === 'labTestCategory-COVID' && // TODO: fetch this from somewhere
    labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED
  ) {
    const encounter = await models.Encounter.findOne({ where: { id: labRequest.encounterId } });

    // Bulk create action sets off a hook to send these out
    await models.CertificateNotification.bulkCreate([
      {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING,
        requiresSigning: false,
        patientId: encounter.patientId,
        forwardAddress: await fetchMostRecentEmailAddress(encounter.patientId, models),
      },
    ]);
  }
}
