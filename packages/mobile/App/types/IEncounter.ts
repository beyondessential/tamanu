import { ID } from './ID';
import { IReferenceData } from './IReferenceData';
import { IDiagnosis } from './IDiagnosis';
import { IPatient } from './IPatient';
import { IUser } from './IUser';

export enum EncounterType {
  Admission = 'admission',
  Clinic = 'clinic',
  Imaging = 'imaging',
  Emergency = 'emergency',
  Observation = 'observation',
  Triage = 'triage',
  SurveyResponse = 'surveyResponse',
}

export interface IEncounter {
  id: ID;

  encounterType: EncounterType;

  startDate: Date;
  endDate?: Date;

  reasonForEncounter?: string;

  location?: IReferenceData;
  locationId?: string;

  department?: IReferenceData;
  departmentId?: string;

  diagnoses?: IDiagnosis[];

  patient?: IPatient | string;
  patientId?: string;

  examiner?: IUser | string;
  examinerId?: string;

  markedForUpload?: boolean;

  deviceId?: string;
}
