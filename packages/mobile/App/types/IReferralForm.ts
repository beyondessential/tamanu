import { ID } from './ID';

export enum FieldType {
  TEXT = 'FreeText',
  MULTILINE = 'Multiline',
  RADIO = 'Radio',
  SELECT = 'Select',
  DATE = 'Date',
  SUBMISSION_DATE = 'SubmissionDate',
  INSTRUCTION = 'Instruction',
  NUMBER = 'Number',
  BINARY = 'Binary',
  CHECKBOX = 'Checkbox',
  CALCULATED = 'CalculatedQuestion',
  CONDITION = 'ConditionQuestion',
  RESULT = 'Result',
}

export enum QuestionType {
  Input = 'input',
  Survey = 'survey',
  Patient = 'patient',
  Link = 'link',
}

export interface IReferralQuestion {
  id: ID;
  referralForm: IReferralForm;
  referralFormId: ID;
  field: FieldType;
  type: QuestionType;
  index?: number;
  question: string;
  options?: string;
  source?: string;
}

export interface IReferralForm {
  id: ID;
  title: string;
  questions: IReferralQuestion[];
}

