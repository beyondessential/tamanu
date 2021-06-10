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
}

export interface IEncounter {
  id: ID;

  encounterType: EncounterType;

  startDate: Date;
  endDate?: Date;

  reasonForEncounter?: string;

  location?: ILocation;
  department?: IDepartment;

  diagnoses?: IDiagnosis[];

  patient?: IPatient;

  examiner?: IUser;

  markedForUpload?: boolean;

  deviceId?: string;
}
