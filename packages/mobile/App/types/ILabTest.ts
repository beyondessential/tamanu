import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { ILabRequest, LabRequestStatus} from './ILabRequest';
import { ILabTestType } from './ILabTestType';
import { IReferenceData } from './IReferenceData';

export import LabTestStatus = LabRequestStatus; // TODO: fix this mess

export const LAB_TEST_STATUS_OPTIONS = createDropdownOptionsFromObject(LabTestStatus);

export interface ILabTest {
  id: ID;
  sampleTime: Date;
  status: LabTestStatus; // Use different status!!
  result: String;

  labRequest: ILabRequest;
  labRequestId: string;

  category: IReferenceData;
  categoryId: string;

  labTestType: ILabTestType;
  labTestTypeId?: string;
}
