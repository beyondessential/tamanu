import { snake } from 'case';
import { Utils } from 'sequelize';
import { NOTE_RECORD_TYPES, NOTE_RECORD_TYPE_VALUES } from '@tamanu/constants';

const recordTypesWithPatientViaEncounter = ['Triage', 'LabRequest', 'ImagingRequest'];

function buildNoteLinkedSyncFilter(patientIds, sessionConfig, isNotePage) {
  if (patientIds.length === 0) {
    return null;
  }

  const recordTypesToTables = {};
  NOTE_RECORD_TYPE_VALUES.forEach(r => {
    recordTypesToTables[r] = Utils.pluralize(snake(r));
  });

  let joins = NOTE_RECORD_TYPE_VALUES.filter(r => r !== NOTE_RECORD_TYPES.PATIENT).map(
    r =>
      `LEFT JOIN ${recordTypesToTables[r]} ON note_pages.record_id = ${recordTypesToTables[r]}.id AND note_pages.record_type = '${r}'`,
  );
  joins = joins.concat(
    recordTypesWithPatientViaEncounter.map(
      r =>
        `LEFT JOIN encounters AS ${recordTypesToTables[r]}_encounters ON ${recordTypesToTables[r]}.encounter_id = ${recordTypesToTables[r]}_encounters.id`,
    ),
  );

  const whereOrs = [
    `
      ( note_pages.record_id IN (:patientIds) AND note_pages.record_type = '${NOTE_RECORD_TYPES.PATIENT}')
    `,
    ...NOTE_RECORD_TYPE_VALUES.filter(r => recordTypesWithPatientViaEncounter.includes(r)).map(
      r =>
        `( ${recordTypesToTables[r]}_encounters.patient_id IN (:patientIds) AND note_pages.record_type = '${r}' )`,
    ),
    ...NOTE_RECORD_TYPE_VALUES.filter(
      r => !recordTypesWithPatientViaEncounter.includes(r) && r !== 'Patient',
    ).map(
      r =>
        `( ${recordTypesToTables[r]}.patient_id IN (:patientIds) AND note_pages.record_type = '${r}' )`,
    ),
  ];

  const join = `
    ${isNotePage ? '' : 'JOIN note_pages ON note_items.note_page_id = note_pages.id'}
    ${joins.join('\n')}
  `;

  if (sessionConfig.syncAllLabRequests) {
    whereOrs.push(`note_pages.record_type = '${NOTE_RECORD_TYPES.LAB_REQUEST}'`);
  }

  return `
    ${join}
    WHERE (
      ${whereOrs.join('\nOR ')}
    )
    AND ${isNotePage ? 'note_pages' : 'note_items'}.updated_at_sync_tick > :since
  `;
}

export function buildNotePageLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, true);
}

export function buildNoteItemLinkedSyncFilter(patientIds, sessionConfig) {
  return buildNoteLinkedSyncFilter(patientIds, sessionConfig, false);
}
