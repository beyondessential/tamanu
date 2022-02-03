import { ICAO_DOCUMENT_TYPES, LAB_REQUEST_STATUSES } from '../constants';

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
          // TODO: fowardAddress: {pull from surveys}
        };
      }),
  );

  // Bulk create action sets off a hook to send these out
  await models.CertificateNotification.bulkCreate(notifications);
}
