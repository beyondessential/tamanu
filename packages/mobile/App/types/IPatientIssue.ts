import { IPatient } from './IPatient';

export interface IPatientIssue {
  id: string;
  note?: string;
  recordedDate: string;
  type: PatientIssueType;
  patient?: Partial<IPatient>;
  patientId: string;
}

export enum PatientIssueType {
  Issue = 'issue',
  Warning = 'warning',
}
