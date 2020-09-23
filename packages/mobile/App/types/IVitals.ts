import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IVitals {
  id: ID;

  date: Date;

  weight: string;
  circumference: string;
  sp02: string;
  heartRate: string;
  fev: string;
  cholesterol: string;
  bloodGlucose: string;
  bloodPressure: string;
  comments: string;

  location: IReferenceData;
}
