import { IPatient } from './IPatient';

export interface IPatientIssue {
  id: string;
  note?: string;
  recordedDate: Date;
  type: PatientIssueType;
  patient?: Partial<IPatient>;
  patientId: string;
}

export enum PatientIssueType {
  Issue = 'issue',
  Warning = 'warning',
}
