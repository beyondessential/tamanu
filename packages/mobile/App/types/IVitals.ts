import { ID } from './ID';

export const AVPUType = {
  Alert: 'alert',
  Verbal: 'verbal',
  Pain: 'pain',
  Unresponsive: 'unresponsive',
} as const;

export type AVPUType = (typeof AVPUType)[keyof typeof AVPUType];

export const DetectedPresenceType = {
  None: 'none',
  Trace: 'trace',
  Small: 'small',
  Moderate: 'moderate',
  Large: 'large',
} as const;

export type DetectedPresenceType = (typeof DetectedPresenceType)[keyof typeof DetectedPresenceType];

export const UrineNitritesType = {
  Negative: 'negative',
  Positive: 'positive',
} as const;

export type UrineNitritesType = (typeof UrineNitritesType)[keyof typeof UrineNitritesType];

export const UrineProteinType = {
  Negative: 'negative',
  Trace: 'trace',
  Thirty: '30',
  Hundred: '100',
  ThreeHundred: '300',
  TwoThousandPlus: '2000+',
} as const;

export type UrineProteinType = (typeof UrineProteinType)[keyof typeof UrineProteinType];

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
