import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientContact {
  id: string;
  name?: string;
  method: string;
  address: string;
  deletionStatus?: string;
  patient: IPatient;
  relationship: IReferenceData;
}
