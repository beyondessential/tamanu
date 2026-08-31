import type { IPatientAdditionalData } from './IPatientAdditionalData';
import type { IPatientSecondaryId } from './IPatientSecondaryId';
import type { IReferenceData } from './IReferenceData';

export interface IPatient {
  id: string;
  displayId: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  sex: string;
  dateOfBirth?: string;
  email?: string;
  culturalName?: string;
  village?: IReferenceData;
  villageId?: string;
  additionalData?: IPatientAdditionalData;
  secondaryIds?: IPatientSecondaryId[];
}
