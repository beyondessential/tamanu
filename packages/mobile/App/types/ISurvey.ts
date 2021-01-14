import { ID } from './ID';

export interface ISurvey {
  id: ID;

  programId: ID;

  name: string;
}

export interface ISurveyScreenComponent {
  id: ID;

  required: boolean;

  survey?: ISurvey;
  dataElement?: IProgramDataElement;

  screenIndex: number;
  componentIndex: number;
  text: string;
  visibilityCriteria: string;
  options: string;
}

export enum DataElementType {
  Autocomplete = 'Autocomplete',
  Binary = 'Binary',
  Calculated = 'Calculated',
  Checkbox = 'Checkbox',
  Date = 'Date',
  FreeText = 'FreeText',
  Instruction = 'Instruction',
  Number = 'Number',
  Radio = 'Radio',
  Result = 'Result',
}

export interface IProgramDataElement {
  id: ID;
  code: string;
  indicator?: string;
  defaultText: string;
  defaultOptions: string;
  type: DataElementType;
}
