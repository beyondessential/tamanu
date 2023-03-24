import { ID } from './ID';
import { INoteItem } from './INoteItem';
import { DateString } from './DateString';

export enum NoteRecordType {
  ENCOUNTER = 'Encounter',
  PATIENT = 'Patient',
  TRIAGE = 'Triage',
  PATIENT_CARE_PLAN = 'PatientCarePlan',
  LAB_REQUEST = 'LabRequest',
  IMAGING_REQUEST = 'ImagingRequest',
}

export enum NoteType {
  TREATMENT_PLAN = 'treatmentPlan',
  MEDICAL = 'medical',
  SURGICAL = 'surgical',
  NURSING = 'nursing',
  DIETARY = 'dietary',
  PHARMACY = 'pharmacy',
  PHYSIOTHERAPY = 'physiotherapy',
  SOCIAL = 'social',
  DISCHARGE = 'discharge',
  AREA_TO_BE_IMAGED = 'areaToBeImaged',
  RESULT_DESCRIPTION = 'resultDescription',
  SYSTEM = 'system',
  OTHER = 'other',
  CLINICAL_MOBILE = 'clinicalMobile',
  HANDOVER = 'handover',
}

export interface INotePage {
  id: ID;
  noteType: NoteType;
  date: DateString;

  recordType: NoteRecordType;
  recordId: ID;

  noteItems: INoteItem[];
}
