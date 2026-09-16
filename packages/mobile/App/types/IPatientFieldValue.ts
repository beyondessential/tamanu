import type { IPatient } from './IPatient';
import type { IPatientFieldDefinition } from './IPatientFieldDefinition';

export interface IPatientFieldValue {
  patient: IPatient;
  definition: IPatientFieldDefinition;
  value: string;
  id: string;
}
