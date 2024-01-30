import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientContact {
  id: string;
  name?: string;
  method: string;
  connectionDetails?: string;
  deletionStatus?: string;
  patient: IPatient;
  relationship: IReferenceData;
}
