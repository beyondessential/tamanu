import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export enum AVPUType {
  Alert = 'alert',
  Verbal = 'verbal',
  Pain = 'pain',
  Unresponsive = 'unresponsive',
}

export interface IVitals {
  id: ID;

  date: Date;

  weight?: number;
  height?: number;
  sbp?: number;
  dbp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  svO2?: number;

  avpu?: AVPUType;

  comments?: string;

  location?: IReferenceData;
}
