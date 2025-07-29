import { ID } from './ID';
import { IUser } from './IUser';
import { DateString } from './DateString';

export const NoteRecordType = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
} as const;

export type NoteRecordType = (typeof NoteRecordType)[keyof typeof NoteRecordType];

export const NoteType = {
  TREATMENT_PLAN: 'treatmentPlan',
  MEDICAL: 'medical',
  SURGICAL: 'surgical',
  NURSING: 'nursing',
  DIETARY: 'dietary',
  PHARMACY: 'pharmacy',
  PHYSIOTHERAPY: 'physiotherapy',
  SOCIAL: 'social',
  DISCHARGE: 'discharge',
  AREA_TO_BE_IMAGED: 'areaToBeImaged',
  RESULT_DESCRIPTION: 'resultDescription',
  SYSTEM: 'system',
  OTHER: 'other',
  CLINICAL_MOBILE: 'clinicalMobile',
  HANDOVER: 'handover',
} as const;

export type NoteType = (typeof NoteType)[keyof typeof NoteType];

export interface INote {
  id: ID;
  noteType: NoteType;
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
