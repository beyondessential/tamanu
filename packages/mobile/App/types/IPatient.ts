import { IPatientAdditionalData } from './IPatientAdditionalData';
import { IPatientSecondaryId } from './IPatientSecondaryId';
import { IReferenceData } from './IReferenceData';

export interface IPatient {
  id: string;
  displayId: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  sex: string;
  dateOfBirth?: string;
  email?: string;
  culturalName?: string;
  village?: IReferenceData,
  villageId?: string,
  additionalData?: IPatientAdditionalData;
  secondaryIds?: IPatientSecondaryId[];
}
