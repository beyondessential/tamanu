import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';
import { IEncounter } from './IEncounter';
import { ILabTest } from './ILabTest';
import { IReferenceData } from './IReferenceData';
import { IUser } from './IUser';

export enum Status {
  RECEPTION_PENDING = 'reception_pending',
  RESULTS_PENDING = 'results_pending',
  TO_BE_VERIFIED = 'to_be_verified',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
};

export const STATUS_OPTIONS = createDropdownOptionsFromObject(Status);

export interface ILabRequest {
  id: ID;
  sampleTime: Date;
  requestedDate: Date;
  urgent: boolean;  
  specimenAttached: boolean;  
  status?: String;
  senaiteId?: String;  
  sampleId?: String;  
  note?: String;

  encounter: IEncounter;
  encounterId?: string;
  
  requestedBy: IUser;
  requestedById?: string;
  
  category: IReferenceData;
  labTestCategoryId?: string;

  tests: ILabTest[];
}
