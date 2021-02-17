import { ID } from './ID';

export enum FieldType {
  TextField = 'TextField',
  LinkField = 'LinkField',
  Radio = 'Radio',
  Select = 'Select',
  FreeText = 'FreeText',
}

export enum QuestionType {
  Survey = 'Survey',
  Field = 'Field',
  Patient = 'Patient',
  Link = 'Link',
}

export interface IReferralQuestion {
  id: ID;
  referralForm: IReferralForm;
  referralFormId: ID;
  field: FieldType;
  type: QuestionType;
  index: number;
  question: string;
  options?: string;
  source?: string;
}

export interface IReferralForm {
  id: ID;
  title: string;
  questions: IReferralQuestion[];
}

