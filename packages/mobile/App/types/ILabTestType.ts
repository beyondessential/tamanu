


// import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export enum LabTestQuestionType {
  NUMBER = 'number',
  STRING = 'string',
};

// export const STATUS_OPTIONS = createDropdownOptionsFromObject(Status);

export interface ILabTestType {
  id: ID;
  code: string,
  name: string,
  unit: string,
  maleMin?: number,
  maleMax?: number,
  femaleMin?: number,
  femaleMax?: number,
  rangeText?: string,
  questionType: LabTestQuestionType,
  options?: string,

  labTestCategory: IReferenceData,
  labTestCategoryId: string,
}
