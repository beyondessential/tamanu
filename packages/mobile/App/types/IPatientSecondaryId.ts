import type { IPatient } from './IPatient';
import type { IReferenceData } from './IReferenceData';

export interface IPatientSecondaryId {
  id: string;
  value: string;
  visibilityStatus: string;
  type?: IReferenceData;
  typeId?: string;
  patient?: Partial<IPatient>;
  patientId: string;
}
