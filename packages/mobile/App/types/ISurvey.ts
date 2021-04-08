import { ID } from './ID';

export interface ISurvey {
  id: ID;

  programId: ID;

  name?: string;

  surveyType?: SurveyTypes;
}

export enum SurveyTypes {
  Programs = 'programs',
  Referral = 'referral',
  Obsolete = 'obsolete',
}

export interface ISurveyScreenComponent {
  id: ID;

  required: boolean;

  survey?: ISurvey;
  dataElement?: IProgramDataElement;

  screenIndex?: number;
  componentIndex?: number;
  text?: string;
  visibilityCriteria?: string;
  config?: string;
  options?: string;
  calculation?: string;
  source?: string;

  getConfigObject();
  getOptions();
}

export enum DataElementType {
  // For later versions
  // Meditrak-specific
  Arithmetic = 'Arithmetic',
  Autocomplete = 'Autocomplete',
  Binary = 'Binary',
  Calculated = 'CalculatedQuestion',
  Checkbox = 'Checkbox',
  CodeGenerator = 'CodeGenerator',
  Condition = 'Condition',
  ConditionQuestion = 'ConditionQuestion',
  Date = 'Date',
  DaysSince = 'DaysSince',
  Entity = 'Entity',
  FreeText = 'FreeText',
  Geolocate = 'Geolocate',
  Instruction = 'Instruction',
  MonthsSince = 'MonthsSince',
  Multiline = 'Multiline',
  MultiSelect = 'MultiSelect',
  Number = 'Number',
  Photo = 'Photo',
  PrimaryEntity = 'PrimaryEntity',
  Radio = 'Radio',
  Result = 'Result',
  Select = 'Select',
  SubmissionDate = 'SubmissionDate',
  YearsSince = 'YearsSince',
  SurveyAnswer = 'SurveyAnswer',
  SurveyResult = 'SurveyResult',
  SurveyLink = 'SurveyLink',
}

export interface IProgramDataElement {
  id: ID;
  code?: string;
  name?: string;
  defaultText?: string;
  defaultOptions?: string;
  type: DataElementType;
}
