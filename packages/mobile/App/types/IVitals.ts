import { ID } from './ID';

export enum AVPUType {
  Alert = 'alert',
  Verbal = 'verbal',
  Pain = 'pain',
  Unresponsive = 'unresponsive',
}

export interface IVitals {
  id: ID;

  dateRecorded: Date;

  temperature?: number;
  weight?: number;
  height?: number;
  sbp?: number;
  dbp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spO2?: number;
  avpu?: AVPUType;
}
