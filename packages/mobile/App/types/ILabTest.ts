import type { ID } from './ID';
import type { ILabRequest } from './ILabRequest';
import type { ILabTestPanelRequest } from './ILabTestPanelRequest';
import type { ILabTestType } from './ILabTestType';
import type { IReferenceData } from './IReferenceData';

export interface ILabTest {
  id: ID;
  date: string;
  result: string;
  secondaryResult?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  referenceRangeText?: string;

  labRequest: ILabRequest;
  labRequestId: string;

  category: IReferenceData;
  categoryId: string;

  labTestType: ILabTestType;
  labTestTypeId: string;

  labTestPanelRequest: ILabTestPanelRequest;
  labTestPanelRequestId: string;
}
