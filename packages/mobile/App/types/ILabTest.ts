// import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { ILabRequest } from './ILabRequest';
import { ILabTestType } from './ILabTestType';
import { IReferenceData } from './IReferenceData';

// TODO: Maybe don't copy LabRequestStatus manually
export enum LabTestStatus {
  RECEPTION_PENDING = 'reception_pending',
  RESULTS_PENDING = 'results_pending',
  TO_BE_VERIFIED = 'to_be_verified',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
};

// export const LAB_TEST_STATUS_OPTIONS = createDropdownOptionsFromObject(LabTestStatus);

export interface ILabTest {
  id: ID;
  sampleTime: Date;
  status: LabTestStatus;
  result: String;

  labRequest: ILabRequest;
  labRequestId: string;

  category: IReferenceData;
  categoryId: string;

  labTestType: ILabTestType;
  labTestTypeId: string;
}
