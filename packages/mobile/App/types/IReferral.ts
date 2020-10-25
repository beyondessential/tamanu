import { Diagnosis, Patient } from '~/models';
import { ID } from './ID';

export interface IReferral {
  id: ID;
  referralNumber: string;
  practitioner: string;
  referredFacility: string;
  referredDepartment: string;
  date: Date;
  patient: Patient;
  diagnosis: Diagnosis;
  notes: string;
}
