import type { LabTestPanel } from '~/models/LabTestPanel';
import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { IReferenceData } from './IReferenceData';

export const LabTestResultType = {
  NUMBER: 'Number',
  FREE_TEXT: 'FreeText',
  SELECT: 'Select',
} as const;

export type LabTestResultType = (typeof LabTestResultType)[keyof typeof LabTestResultType];

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
  isSensitive: boolean;
  supportsSecondaryResults: boolean;
  visibilityStatus: VisibilityStatus.Current;

  labTestPanels?: LabTestPanel[];
}
