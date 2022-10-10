import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ISurvey, IProgramDataElement } from './ISurvey';

export interface ISurveyResponse {
  id: ID;
  surveyId: ID;
  startTime?: string;
  endTime?: string;
  result?: number;
  resultText?: string;
  encounter?: IEncounter | string;
  survey?: ISurvey | string;
}

export interface ISurveyResponseAnswer {
  id: ID;

  response?: ISurveyResponse | string;
  responseId: ID;
  dataElement: IProgramDataElement | string;
  dataElementId: ID;

  name?: string;
  body?: string;
}
