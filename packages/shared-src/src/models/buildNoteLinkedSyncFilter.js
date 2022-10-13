import { Op } from 'sequelize';

function buildNoteLinkedSyncFilter(patientIds, isNotePage) {
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

  return {
    where: {
      [Op.or]: [
        { [`$${pathToNotePage}record_id$`]: { [Op.in]: patientIds } },
        { [`$${pathToNotePage}encounter.patient_id$`]: { [Op.in]: patientIds } },
        { [`$${pathToNotePage}patientCarePlan.patient_id$`]: { [Op.in]: patientIds } },
        { [`$${pathToNotePage}triage.encounter.patient_id$`]: { [Op.in]: patientIds } },
        { [`$${pathToNotePage}labRequest.encounter.patient_id$`]: { [Op.in]: patientIds } },
        { [`$${pathToNotePage}imagingRequest.encounter.patient_id$`]: { [Op.in]: patientIds } },
      ],
    },
    include: isNotePage
      ? includeFromNotePage
      : [{ association: 'notePage', include: includeFromNotePage }],
  };
}

export function buildNotePageLinkedSyncFilter(patientIds) {
  return buildNoteLinkedSyncFilter(patientIds, true);
}

export function buildNoteItemLinkedSyncFilter(patientIds) {
  return buildNoteLinkedSyncFilter(patientIds, false);
}
