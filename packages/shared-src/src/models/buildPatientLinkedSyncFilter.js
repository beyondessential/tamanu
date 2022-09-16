import { Op } from 'sequelize';

export function buildPatientLinkedSyncFilter(patientIds) {
  return {
    where: { patientId: { [Op.in]: patientIds } },
  };
}
