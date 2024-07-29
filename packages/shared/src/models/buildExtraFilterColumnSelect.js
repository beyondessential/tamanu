export function buildExtraFilterColumnSelect({
  patientId,
  facilityId,
  encounterId,
  isLabRequest,
  updatedAtByFieldSum,
}) {
  return `
    ${patientId} || NULL,
    ${facilityId} || NULL,
    ${encounterId} || NULL,
    ${isLabRequest} || FALSE,
    ${updatedAtByFieldSum} || NULL
  `;
}
