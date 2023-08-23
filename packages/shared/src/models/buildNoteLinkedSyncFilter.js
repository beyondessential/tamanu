import { snake } from 'case';
import { Utils } from 'sequelize';
import { NOTE_RECORD_TYPES, NOTE_RECORD_TYPE_VALUES } from '@tamanu/constants';

const recordTypesWithPatientViaEncounter = ['Triage', 'LabRequest', 'ImagingRequest'];

export function buildNoteLinkedSyncFilter(patientIds, sessionConfig) {
  if (patientIds.length === 0) {
    return null;
  }

  const recordTypesToTables = {};
  NOTE_RECORD_TYPE_VALUES.forEach(r => {
    recordTypesToTables[r] = Utils.pluralize(snake(r));
  });

  let joins = NOTE_RECORD_TYPE_VALUES.filter(r => r !== NOTE_RECORD_TYPES.PATIENT).map(
    r =>
      `LEFT JOIN ${recordTypesToTables[r]} ON notes.record_id = ${recordTypesToTables[r]}.id AND notes.record_type = '${r}'`,
  );
  joins = joins.concat(
    recordTypesWithPatientViaEncounter.map(
      r =>
        `LEFT JOIN encounters AS ${recordTypesToTables[r]}_encounters ON ${recordTypesToTables[r]}.encounter_id = ${recordTypesToTables[r]}_encounters.id`,
    ),
  );

  const whereOrs = [
    `
      ( notes.record_id IN (:patientIds) AND notes.record_type = '${NOTE_RECORD_TYPES.PATIENT}')
    `,
    ...NOTE_RECORD_TYPE_VALUES.filter(r => recordTypesWithPatientViaEncounter.includes(r)).map(
      r =>
        `( ${recordTypesToTables[r]}_encounters.patient_id IN (:patientIds) AND notes.record_type = '${r}' )`,
    ),
    ...NOTE_RECORD_TYPE_VALUES.filter(
      r => !recordTypesWithPatientViaEncounter.includes(r) && r !== 'Patient',
    ).map(
      r =>
        `( ${recordTypesToTables[r]}.patient_id IN (:patientIds) AND notes.record_type = '${r}' )`,
    ),
  ];

  const join = `
    ${joins.join('\n')}
  `;

  if (sessionConfig.syncAllLabRequests) {
    whereOrs.push(`notes.record_type = '${NOTE_RECORD_TYPES.LAB_REQUEST}'`);
  }

  return `
    ${join}
    WHERE (
      ${whereOrs.join('\nOR ')}
    )
    AND notes.updated_at_sync_tick > :since
  `;
}
