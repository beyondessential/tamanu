import { ID } from './ID';

export enum EncounterType = {
  Admission = 'admission',
  Clinic = 'clinic',
  Imaging = 'imaging',
  Emergency = 'emergency',
  Observation = 'observation',
  Triage = 'triage',
  SurveyResponse = 'surveyResponse',
};

export interface IEncounter {
  id: ID;

  patientId: ID;
  departmentId: ID;
  locationId: ID;
  examinerId: ID;

  encounterType: EncounterType;

  startDate: Date;
  endDate?: Date;

  reasonForEncounter: string;
}
