import { IPatient } from './IPatient';
import { IPatientFieldDefinition } from './IPatientFieldDefinition';

export interface IPatientFieldValue {
  patient: IPatient;
  definition: IPatientFieldDefinition;
  value: string;
  id: string;
}
