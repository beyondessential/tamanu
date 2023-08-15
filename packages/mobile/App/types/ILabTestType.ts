import { LabPanel } from '~/models/LabPanel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export enum LabTestResultType {
  NUMBER = 'Number',
  FREE_TEXT = 'FreeText',
  SELECT = 'Select',
}

export interface ILabTestType {
  id: ID;
  code: string;
  name: string;
  unit: string;
  maleMin?: number;
  maleMax?: number;
  femaleMin?: number;
  femaleMax?: number;
  rangeText?: string;
  resultType?: LabTestResultType;
  options?: string;

  labTestCategory: IReferenceData;
  labTestCategoryId: string;
  visibilityStatus: VisibilityStatus.Current;

  labPanels?: LabPanel[];
}
