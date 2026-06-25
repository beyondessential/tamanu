import { ID } from './ID';
import { ILabRequest } from './ILabRequest';
import { ILabTestType } from './ILabTestType';
import { IReferenceData } from './IReferenceData';

export interface ILabTest {
  id: ID;
  date: string;
  result: string;
  secondaryResult?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;

  labRequest: ILabRequest;
  labRequestId: string;

  category: IReferenceData;
  categoryId: string;

  labTestType: ILabTestType;
  labTestTypeId: string;
}
