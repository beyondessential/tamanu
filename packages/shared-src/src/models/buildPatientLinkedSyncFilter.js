import { Op } from 'sequelize';

export function buildPatientLinkedSyncFilter(patientIds) {
  if (patientIds.length === 0) {
    return null;
  }
  return {
    where: { patientId: { [Op.in]: patientIds } },
  };
}
