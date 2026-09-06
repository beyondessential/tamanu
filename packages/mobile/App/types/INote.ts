import type { ID } from './ID';
import type { IUser } from './IUser';
import type { DateString } from './DateString';

export const NoteRecordType = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
} as const;

export type NoteRecordType = (typeof NoteRecordType)[keyof typeof NoteRecordType];

export interface INote {
  id: ID;
  noteTypeId: string;
  date: DateString;

  recordType: NoteRecordType;
  recordId: ID;

  content: string;

  revisedById?: string;

  author?: IUser;
  authorId?: ID;

  onBehalfOf?: IUser;
  onBehalfOfId?: ID;
}
