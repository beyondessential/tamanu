import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ILabTest } from './ILabTest';
import { IReferenceData } from './IReferenceData';
import { IUser } from './IUser';

export enum LabRequestStatus {
  RECEPTION_PENDING = 'reception_pending',
  RESULTS_PENDING = 'results_pending',
  TO_BE_VERIFIED = 'to_be_verified',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
};

export const LAB_REQUEST_STATUS_OPTIONS = createDropdownOptionsFromObject(LabRequestStatus);

export interface ILabRequest {
  id: ID;
  sampleTime: Date;
  requestedDate: Date;
  urgent?: boolean;  
  specimenAttached?: boolean;
  status?: LabRequestStatus;
  senaiteId?: string;  
  sampleId?: string;  
  note?: string;

  encounter: IEncounter;
  encounterId?: string;
  
  requestedBy: IUser;
  requestedById?: string;
  
  category: IReferenceData;
  labTestCategoryId?: string;

  tests: ILabTest[];
}

export interface IDataRequiredToCreateLabRequest {
  id?: ID; // has default
  sampleTime?: Date; // has default
  requestedDate?: Date; // has default
  urgent?: boolean;  
  specimenAttached?: boolean;
  status?: LabRequestStatus;
  senaiteId?: string;  
  sampleId?: string;  
  note?: string;

  encounter: string;
  
  requestedBy: string;
  
  category: string;

  labTestTypeIds: string[];
}
