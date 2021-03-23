import { IPatientAdditionalData } from './IPatientAditionalData';

export interface IPatient {
  id: string;
  displayId: string;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  sex: string;
  dateOfBirth: Date;
  culturalName?: string;
  cityTown?: string;
  additionalData: IPatientAdditionalData;
}
