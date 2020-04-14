import { PatientModel } from '../models/Patient';

export interface OperativePlanDataProps {
  operativePlan: {
    data: string[];
  };
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
  reminderWarnings: boolean;
}

export interface PatientGeneralInformationDataProps {
  id: string;
  generalInfo: PatientModel;
}

export type PatientDetails = PatientGeneralInformationDataProps &
  ReminderWarnings &
  PatientParentsDataProps &
  OnGoingConditionsDataProps &
  FamilyHistoryDataProps &
  OperativePlanDataProps;
