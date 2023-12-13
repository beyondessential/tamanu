import { IPatient } from '~/types';

export interface AllergiesProps {
  allergies: {
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
  reminderWarnings?: boolean;
}

export interface PatientGeneralInformationDataProps {
  generalInfo: IPatient;
}

export type PatientDetails =
  & PatientGeneralInformationDataProps
  & ReminderWarnings
  & OnGoingConditionsDataProps
  & FamilyHistoryDataProps
  & AllergiesProps;
