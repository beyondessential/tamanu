import { IPatientAdditionalData } from './IPatientAditionalData';
import { IReferenceData } from './IReferenceData';

export interface IPatient {
  id: string;
  displayId: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  sex: string;
  dateOfBirth?: Date;
  culturalName?: string;
  village?: IReferenceData,
  villageId?: string,
  additionalData?: IPatientAdditionalData;
  markedForSync?: boolean;
}
