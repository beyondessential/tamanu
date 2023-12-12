import { ID } from './ID';
import { IDiagnosis } from './IDiagnosis';
import { IPatient } from './IPatient';
import { IUser } from './IUser';
import { IDepartment } from './IDepartment';
import { ILocation } from './ILocation';

export enum EncounterType {
  Admission = 'admission',
  Clinic = 'clinic',
  Imaging = 'imaging',
  Emergency = 'emergency',
  Observation = 'observation',
  Triage = 'triage',
  SurveyResponse = 'surveyResponse',
  Vaccination = 'vaccination',
}

export interface IEncounter {
  id: ID;

  encounterType: EncounterType;

  startDate: string;
  endDate?: string;

  reasonForEncounter?: string;

  location?: ILocation;
  department?: IDepartment;
  locationId?: string;
  departmentId?: string;

  diagnoses?: IDiagnosis[];

  patient?: IPatient | string;
  patientId?: string;

  examiner?: IUser | string;
  examinerId?: string;

  deviceId?: string;
  deletionStatus?: string;
}
