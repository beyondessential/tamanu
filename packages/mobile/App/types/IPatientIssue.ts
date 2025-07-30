import { IPatient } from './IPatient';

export interface IPatientIssue {
  id: string;
  note?: string;
  recordedDate: string;
  type: PatientIssueType;
  patient?: Partial<IPatient>;
  patientId: string;
}

export const PatientIssueType = {
  Issue: 'issue',
  Warning: 'warning',
} as const;

export type PatientIssueType = (typeof PatientIssueType)[keyof typeof PatientIssueType];
