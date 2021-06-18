


// import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';

export enum LabTestQuestionType {
  NUMBER = 'number',
  STRING = 'string',
};

// export const STATUS_OPTIONS = createDropdownOptionsFromObject(Status);

export interface ILabTestType {
  id: ID;
  code: String,
  name: String,
  unit: String,
  maleMin: number,
  maleMax: number,
  femaleMin: number,
  femaleMax: number,
  rangeText: String,
  questionType: LabTestQuestionType,
  options: String,
}
