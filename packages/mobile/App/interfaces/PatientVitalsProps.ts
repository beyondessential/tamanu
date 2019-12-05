export interface PatientVitalsProps {
  [key: string]: number | string;
  id: number;
  blood_pressure: number;
  weight: number;
  circumference: number;
  sp02: number;
  heart_rate: number;
  fev: number;
  cholesterol: number;
  blood_glucose: number;
  date: string;
}
