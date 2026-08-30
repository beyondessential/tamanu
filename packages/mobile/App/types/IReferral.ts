import type { ID } from './ID';
import type { IEncounter } from './IEncounter';
import type { ISurveyResponse } from './ISurveyResponse';

export interface IReferral {
  id: ID;
  referredFacility?: string;
  initiatingEncounter: IEncounter;
  initiatingEncounterId: ID;
  completingEncounter?: IEncounter;
  completingEncounterId?: ID;
  surveyResponse: ISurveyResponse;
  surveyResponseId: ID;
}
