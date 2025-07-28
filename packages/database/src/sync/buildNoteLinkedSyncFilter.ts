import { snake } from 'case';
import { Utils } from 'sequelize';
import { NOTE_RECORD_TYPE_VALUES, NOTE_RECORD_TYPES } from '@tamanu/constants';
import type { SessionConfig } from '../types/sync';

const recordTypesWithPatientViaEncounter = ['Triage', 'LabRequest', 'ImagingRequest'];

function getRecordTypesToTables() {
  return NOTE_RECORD_TYPE_VALUES.reduce((acc: Record<string, string>, recordType) => {
    acc[recordType] = Utils.pluralize(snake(recordType));
    return acc;
  }, {});
}

export function getPatientIdColumnOfNotes() {
  const recordTypesToTables = getRecordTypesToTables();

  const nonEncounterLinkedRecordTypeTables = NOTE_RECORD_TYPE_VALUES.filter(
    r => r !== NOTE_RECORD_TYPES.PATIENT && !recordTypesWithPatientViaEncounter.includes(r),
  ).map(r => recordTypesToTables[r]);
  const encounterTables = recordTypesWithPatientViaEncounter.map(
    r => `${recordTypesToTables[r]}_encounters`,
  );

  const patientTablesFromNotes = [...nonEncounterLinkedRecordTypeTables, ...encounterTables];
  const patientIdColumns = patientTablesFromNotes.map(t => `${t}.patient_id`);
  return `coalesce(${patientIdColumns.join(', ')})`;
}

export function buildNoteLinkedJoins() {
  const recordTypesToTables = getRecordTypesToTables();

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

  // Add facility joins for encounter-linked record types
  const ENCOUNTER_LINKED_RECORD_TYPES = [
    NOTE_RECORD_TYPES.ENCOUNTER,
    NOTE_RECORD_TYPES.TRIAGE,
    NOTE_RECORD_TYPES.LAB_REQUEST,
    NOTE_RECORD_TYPES.IMAGING_REQUEST,
  ];

  const joinsToLocation = ENCOUNTER_LINKED_RECORD_TYPES.map(recordType => {
    const tableAlias =
      recordType === NOTE_RECORD_TYPES.ENCOUNTER
        ? 'encounters'
        : `${recordTypesToTables[recordType]}_encounters`;
    return `(notes.record_type = '${recordType}' AND ${tableAlias}.location_id = locations.id)`;
  }).join(' OR ');

  joins = joins.concat([
    `LEFT JOIN locations ON (${joinsToLocation})`,
    `LEFT JOIN facilities ON locations.facility_id = facilities.id`,
  ]);

  return joins;
}

export function buildNoteLinkedSyncFilter(
  patientCount: number,
  markedForSyncPatientsTable: string,
  sessionConfig: SessionConfig,
) {
  if (patientCount === 0) {
    return null;
  }

  const recordTypesToTables: Record<string, string> = {};
  NOTE_RECORD_TYPE_VALUES.forEach(r => {
    recordTypesToTables[r] = Utils.pluralize(snake(r));
  });

  const joins = buildNoteLinkedJoins();

  const whereOrs = [
    `
      ( notes.record_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) AND notes.record_type = '${NOTE_RECORD_TYPES.PATIENT}')
    `,
    ...NOTE_RECORD_TYPE_VALUES.filter(r => recordTypesWithPatientViaEncounter.includes(r)).map(
      r =>
        `( ${recordTypesToTables[r]}_encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) AND notes.record_type = '${r}' )`,
    ),
    ...NOTE_RECORD_TYPE_VALUES.filter(
      r => !recordTypesWithPatientViaEncounter.includes(r) && r !== 'Patient',
    ).map(
      r =>
        `( ${recordTypesToTables[r]}.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) AND notes.record_type = '${r}' )`,
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
