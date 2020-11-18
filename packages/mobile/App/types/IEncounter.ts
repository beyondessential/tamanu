import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

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

  reasonForEncounter: string;

  location: IReferenceData;
  department: IReferenceData;
}
