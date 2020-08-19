import { ID } from './ID';

export interface ISurvey { 
  id: ID;

  programId: ID;

  name: string;
}

export interface ISurveyScreenComponent {
  id: ID;

  surveyId: ID;
  dataElementId: ID;

  screenIndex: number;
  componentIndex: number;
  text: string;
  visibilityCriteria: string;
  options: string;
}

export enum DataElementType {
  Number = "number",
  Text = "text",
}

export interface IProgramDataElement {
  id: ID;
  code: string;
  name: string;
  indicator: string;
  defaultText: string;
  defaultOptions: string;
  type: DataElementType;
}
