export interface PatientVitalsProps {
  [key: string]: number | Date;
  height: number;
  weight: number;
  temperature: number;
  sbp: number;
  dbp: number;
  heartRate: number;
  respiratoryRate: number;
  sv02: number;
  avpu: number;
  date: Date;
}
