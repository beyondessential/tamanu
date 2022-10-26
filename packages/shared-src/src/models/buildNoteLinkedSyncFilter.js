import { snake } from 'case';
import { Utils } from 'sequelize';
import { NOTE_RECORD_TYPES } from 'shared/constants';

const recordTypesWithPatientViaEncounter = ['TRIAGE', 'LAB_REQUEST', 'IMAGING_REQUEST'];

function buildNoteLinkedSyncFilter(patientIds, sessionConfig, isNotePage) {
  if (patientIds.length === 0) {
    return null;
  }

  const recordTypesToTables = {};
  Object.keys(NOTE_RECORD_TYPES).forEach(r => {
    recordTypesToTables[r] = Utils.pluralize(snake(r));
  });

  const joins = Object.keys(NOTE_RECORD_TYPES).map(
    r =>
      `JOIN ${recordTypesToTables[r]} ON note_pages.record_id = ${recordTypesToTables[r]}.id AND note_pages.record_type = '${r}'`,
  );
  joins.push(
    ...recordTypesWithPatientViaEncounter.map(
      r =>
        `JOIN encounters AS ${recordTypesToTables[r]}_encounters ON ${recordTypesToTables[r]}.encounter_id = ${recordTypesToTables[r]}_encounters.id`,
    ),
  );

  const whereOrs = [
    `
      ( note_pages.record_id IN ($patientIds) AND note_pages.record_type = '${NOTE_RECORD_TYPES.PATIENT}')
    `,
    ...Object.keys(NOTE_RECORD_TYPES)
      .filter(r => recordTypesWithPatientViaEncounter.includes(r))
      .map(r => `${recordTypesToTables[r]}_encounters.patient_id IN ($patientIds)`),
    ...Object.keys(NOTE_RECORD_TYPES)
      .filter(r => !recordTypesWithPatientViaEncounter.includes(r) && r !== 'PATIENT')
      .map(r => `${recordTypesToTables[r]}.patient_id IN ($patientIds)`),
    `patients.id IN ($patientIds)`,
  ];

  const filter = `
    ${isNotePage ? '' : 'JOIN note_pages ON note_items.note_page_id = note_pages.id'}
    ${joins.join('\n')}
    WHERE
      ${whereOrs.join('\nOR ')}
    `;

  if (sessionConfig.syncAllLabRequests) {
    return `
      ${filter}
      OR note_pages.record_type = '${NOTE_RECORD_TYPES.LAB_REQUEST}'
    `;
  }

  return filter;
}

export function buildNotePageLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, true);
}

export function buildNoteItemLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, false);
}
