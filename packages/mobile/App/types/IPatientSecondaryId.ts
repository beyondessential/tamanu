import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientSecondaryId {
  id: string;
  value: string;
  visibilityStatus: string;
  type?: IReferenceData,
  typeId?: string,
  patient?: Partial<IPatient>;
  patientId: string;
}
