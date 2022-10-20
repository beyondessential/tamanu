import { Op } from 'sequelize';
import { NOTE_RECORD_TYPES } from 'shared/constants';

function buildNoteLinkedSyncFilter(patientIds, sessionConfig, isNotePage) {
  if (patientIds.length === 0) {
    return null;
  }

  const pathToNotePage = isNotePage ? '' : 'notePage.';

  const includeFromNotePage = [
    'encounter',
    'patientCarePlan',
    { association: 'triage', include: ['encounter'] },
    { association: 'labRequest', include: ['encounter'] },
    { association: 'imagingRequest', include: ['encounter'] },
  ];

  const whereClauses = [
    { [`$${pathToNotePage}record_id$`]: { [Op.in]: patientIds } },
    { [`$${pathToNotePage}encounter.patient_id$`]: { [Op.in]: patientIds } },
    { [`$${pathToNotePage}patientCarePlan.patient_id$`]: { [Op.in]: patientIds } },
    { [`$${pathToNotePage}triage.encounter.patient_id$`]: { [Op.in]: patientIds } },
    { [`$${pathToNotePage}labRequest.encounter.patient_id$`]: { [Op.in]: patientIds } },
    { [`$${pathToNotePage}imagingRequest.encounter.patient_id$`]: { [Op.in]: patientIds } },
  ];

  if (sessionConfig.syncAllLabRequests) {
    whereClauses.push({ [`$${pathToNotePage}.record_type`]: NOTE_RECORD_TYPES.LAB_REQUEST });
  }

  return {
    where: {
      [Op.or]: whereClauses,
    },
    include: isNotePage
      ? includeFromNotePage
      : [{ association: 'notePage', include: includeFromNotePage }],
  };
}

export function buildNotePageLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, true);
}

export function buildNoteItemLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, false);
}
