import { ID } from './ID';

export enum AVPUType {
  Alert = 'alert',
  Verbal = 'verbal',
  Pain = 'pain',
  Unresponsive = 'unresponsive',
}

export enum DetectedPresenceType {
  None = 'none',
  Trace = 'trace',
  Small = 'small',
  Moderate = 'moderate',
  Large = 'large',
}

export enum UrineNitritesType {
  Negative = 'negative',
  Positive = 'positive',
}

export enum UrineProteinType {
  Negative = 'negative',
  Trace = 'trace',
  Thirty = '30',
  Hundred = '100',
  ThreeHundred = '300',
  TwoThousandPlus = '2000+',
}

export interface IVitals {
  id: ID;

  dateRecorded: string;

  temperature?: number;
  weight?: number;
  height?: number;
  sbp?: number;
  dbp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  avpu?: AVPUType;
  gcs?: number;
  hemoglobin?: number;
  fastingBloodGlucose?: number;
  urinePh?: number;
  urineLeukocytes?: DetectedPresenceType;
  urineNitrites?: UrineNitritesType;
  urobilinogen?: number;
  urineProtein?: UrineProteinType;
  bloodInUrine?: DetectedPresenceType;
  urineSpecificGravity?: number;
  urineKetone?: DetectedPresenceType;
  urineBilirubin?: DetectedPresenceType;
  urineGlucose?: number;
}
