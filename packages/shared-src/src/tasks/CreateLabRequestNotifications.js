import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

async function fetchMostRecentEmailAddress(patientId, models) {
  const surveyQuestion = 'pde-FijCOVRDT008'; // TODO: fetch this from somewhere
  /*
    `SELECT body
       FROM survey_response_answers
       LEFT JOIN survey_responses
        ON (survey_responses.id = survey_response_answers.response_id)
       LEFT JOIN encounters
        ON (survey_responses.encounter_id = encounters.id)
       WHERE
          data_element_id = :questionId
        AND
          encounters.patient_id = :patientId`,
   */
}

export async function createLabRequestNotifications(labRequests, models) {
  const notifications = await Promise.all(
    labRequests
      .filter(labRequest => labRequest.get('labTestCategoryId') === 'labTestCategory-COVID') // TODO: fetch this from somewhere
      .filter(labRequest => labRequest.get('status') === LAB_REQUEST_STATUSES.PUBLISHED)
      .map(async labRequest => {
        const encounter = await models.Encounter.findOne({
          where: { id: labRequest.get('encounterId') },
        });
        return {
          type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING,
          requiresSigning: false,
          patientId: encounter.patientId,
          forwardAddress: await fetchMostRecentEmailAddress(encounter.patientId, models),
        };
      }),
  );

  // Bulk create action sets off a hook to send these out
  await models.CertificateNotification.bulkCreate(notifications);
}
