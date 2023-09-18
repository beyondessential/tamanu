import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ISurvey, IProgramDataElement, SurveyTypes, ISurveyScreenComponent } from './ISurvey';

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

export interface ICreateSurveyResponse extends Omit<ISurveyResponse, 'id'> {
  encounterReason: string;
  surveyType: SurveyTypes;
  components: ISurveyScreenComponent[];
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

export interface ISurveyResponseValues {
  [key: string]: string | number;
};

export type SubmitSurveyResponseFunc = (values: ISurveyResponseValues) => Promise<void>;
