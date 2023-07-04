import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ILabTest } from './ILabTest';
import { IReferenceData } from './IReferenceData';
import { IUser } from './IUser';
import { IDepartment } from './IDepartment';

export enum LabRequestStatus {
  RECEPTION_PENDING = 'reception_pending',
  RESULTS_PENDING = 'results_pending',
  TO_BE_VERIFIED = 'to_be_verified',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
}

export const LAB_REQUEST_STATUS_OPTIONS = createDropdownOptionsFromObject(LabRequestStatus);

export interface ILabRequest {
  id: ID;
  sampleTime: string;
  requestedDate: string;
  urgent?: boolean;
  specimenAttached?: boolean;
  status?: LabRequestStatus;
  senaiteId?: string;
  sampleId?: string;
  displayId: string;

  encounter: IEncounter;
  encounterId?: string;

  requestedBy: IUser;
  requestedById?: string;

  department?: IDepartment;
  departmentId?: string;

  labTestCategory: IReferenceData;
  labTestCategoryId?: string;

  labTestPriority?: IReferenceData;
  labTestPriorityId?: string;

  labSampleSite?: IReferenceData;
  labSampleSiteId?: string;

  tests: ILabTest[];
}

export interface IDataRequiredToCreateLabRequest {
  id?: ID; // has default
  sampleTime?: string; // has default
  requestedDate?: string; // has default
  urgent?: boolean;
  specimenAttached?: boolean;
  status?: LabRequestStatus;
  senaiteId?: string;
  sampleId?: string;
  note?: string;
  displayId: string;

  encounter: string;

  requestedBy: string;

  labTestCategory: string;

  labTestPriority?: string;

  labTestTypeIds: string[];
}
