import { VisibilityStatus } from '~/visibilityStatuses';
import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientSecondaryId {
  id: string;
  value: string;
  visibilityStatus: VisibilityStatus;
  type?: IReferenceData;
  typeId?: string;
  patient?: Partial<IPatient>;
  patientId: string;
}
