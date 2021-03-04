import { ID } from './ID';

export enum SurveyTypes {
  Screening = 'screening',
  Referral = 'referral',
}

export interface ISurveyResponse {
  id: ID;
  surveyId: ID
  surveyType: SurveyTypes;
  startTime?: Date;
  endTime?: Date;
  result?: number;
}

export interface ISurveyResponseAnswer {
  id: ID;

  responseId: ID;
  dataElementId: ID;

  name: string;
  body: string;
}
