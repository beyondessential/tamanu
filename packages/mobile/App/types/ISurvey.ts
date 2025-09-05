import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';

export interface ISurvey {
  id: ID;

  programId: ID;

  name?: string;

  surveyType?: SurveyTypes;

  isSensitive: boolean;

  visibilityStatus: VisibilityStatus;
}

export const SurveyTypes = {
  Programs: 'programs',
  Referral: 'referral',
  Obsolete: 'obsolete',
  Vitals: 'vitals',
} as const;

export type SurveyTypes = (typeof SurveyTypes)[keyof typeof SurveyTypes];

export type ValidationCriteriaNormalRange = {
  min: number;
  max: number;
  ageUnit?: string;
  ageMin?: number;
  ageMax?: number;
};

export type SurveyScreenValidationCriteria = {
  min?: number;
  max?: number;
  mandatory?: boolean | Record<string, any>;
  normalRange?: ValidationCriteriaNormalRange | ValidationCriteriaNormalRange[];
};

export type SurveyScreenConfig = {
  rounding?: number;
  column?: string;
  source?: string;
  scope?: string;
  writeToPatient?: {
    fieldType: string;
  };
};

export interface ISurveyScreenComponent {
  id: ID;
  required: boolean;
  survey?: ISurvey;
  surveyId?: string;
  dataElement?: IProgramDataElement;
  dataElementId?: string;
  screenIndex?: number;
  componentIndex?: number;
  text?: string;
  visibilityCriteria?: string;
  validationCriteria?: string;
  config?: string;
  detail?: string;
  options?: string;
  calculation?: string;
  visibilityStatus?: VisibilityStatus;
  source?: string;
  getConfigObject: () => SurveyScreenConfig;
  getValidationCriteriaObject: () => SurveyScreenValidationCriteria;
  getOptions();
}

export interface IVitalsSurvey {
  id: ID;
  name: string;
  components: ISurveyScreenComponent[];
  dateComponent: ISurveyScreenComponent;
  programId: string;
}

export const DataElementType = {
  // For later versions
  // Meditrak-specific
  Arithmetic: 'Arithmetic',
  Autocomplete: 'Autocomplete',
  Binary: 'Binary',
  Calculated: 'CalculatedQuestion',
  Checkbox: 'Checkbox',
  CodeGenerator: 'CodeGenerator',
  ComplexChartInstanceName: 'ComplexChartInstanceName',
  ComplexChartDate: 'ComplexChartDate',
  ComplexChartType: 'ComplexChartType',
  ComplexChartSubtype: 'ComplexChartSubtype',
  Condition: 'Condition',
  ConditionQuestion: 'ConditionQuestion',
  Date: 'Date',
  DaysSince: 'DaysSince',
  Entity: 'Entity',
  FreeText: 'FreeText',
  Geolocate: 'Geolocate',
  Instruction: 'Instruction',
  MonthsSince: 'MonthsSince',
  Multiline: 'Multiline',
  MultiSelect: 'MultiSelect',
  Number: 'Number',
  Photo: 'Photo',
  PrimaryEntity: 'PrimaryEntity',
  Radio: 'Radio',
  Result: 'Result',
  Select: 'Select',
  Signature: 'Signature',
  SubmissionDate: 'SubmissionDate',
  YearsSince: 'YearsSince',
  SurveyAnswer: 'SurveyAnswer',
  SurveyResult: 'SurveyResult',
  SurveyLink: 'SurveyLink',
  UserData: 'UserData',
  PatientData: 'PatientData',
  PatientIssueGenerator: 'PatientIssueGenerator',
} as const;

export type DataElementType = (typeof DataElementType)[keyof typeof DataElementType];

export interface IProgramDataElement {
  id: ID;
  code?: string;
  name?: string;
  defaultText?: string;
  defaultOptions?: string;
  type: DataElementType;
}
