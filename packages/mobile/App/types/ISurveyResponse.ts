import { ID } from './ID';

export interface ISurveyResponse {
  id: ID;
  surveyId: ID
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
