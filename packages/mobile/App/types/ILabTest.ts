import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { ILabRequest } from './ILabRequest';
import { IReferenceData } from './IReferenceData';

enum Status {
  RECEPTION_PENDING = 'reception_pending',
  RESULTS_PENDING = 'results_pending',
  TO_BE_VERIFIED = 'to_be_verified',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
};

// export const STATUS_OPTIONS = createDropdownOptionsFromObject(Status);

export interface ILabTest {
  id: ID;
  sampleTime: Date;
  status: Status; // Use different status!!
  result: String;

  labRequest: ILabRequest;
  labRequestId: string;

  category: IReferenceData;
  categoryId: string;

  labTestType: ILabTestType;
  labTestTypeId?: string;
}
