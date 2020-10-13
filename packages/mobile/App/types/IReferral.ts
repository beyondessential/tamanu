import { Diagnosis, Patient } from '~/models';
import { ID } from './ID';

export interface IReferral {
  id: ID;
  referralNumber: string; // must be unique
  practitioner: string; // one practitioner to a referral
  referredFacility: string;
  referredDepartment: string;
  date: Date; // default to today
  patient: Patient;
  diagnosis: Diagnosis;
}
