import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ISurveyResponse } from './ISurveyResponse';

export interface IReferral {
  id: ID;
  referralFacility?: string;
  initiatingEncounter: IEncounter;
  initiatingEncounterId: ID;
  completingEncounter?: IEncounter;
  completingEncounterId?: ID;
  surveyResponse: ISurveyResponse;
  surveyResponseId: ID;
}
