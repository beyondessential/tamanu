import { IPatient, IPatientIssue } from '~/types';

export interface AllergiesProps {
  allergies: {
    data: string[];
  };
}

export interface PatientIssuesDataProps {
  patientIssues: IPatientIssue[];
}

export interface FamilyHistoryDataProps {
  familyHistory: {
    data: string[];
  };
}

export interface OnGoingConditionsDataProps {
  ongoingConditions: {
    data: string[];
  };
}

export interface PatientParentsDataProps {
  parentsInfo: {
    motherName?: string;
    fatherName?: string;
  };
}

export interface ReminderWarnings {
  reminderWarnings?: boolean;
}

export interface PatientGeneralInformationDataProps {
  id: string;
  generalInfo: IPatient;
}

export type PatientDetails =
  PatientGeneralInformationDataProps &
  ReminderWarnings &
  OnGoingConditionsDataProps &
  FamilyHistoryDataProps &
  AllergiesProps &
  PatientIssuesDataProps;
