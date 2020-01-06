export interface PatientVitalsProps {
  [key: string]: number | string;
  id: number;
  bloodPressure: number;
  weight: number;
  circumference: number;
  sp02: number;
  heartRate: number;
  fev: number;
  cholesterol: number;
  bloodGlucose: number;
  date: string;
}
