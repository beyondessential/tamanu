import { Diagnosis, Patient, ReferenceData } from '~/models';
import { ID } from './ID';
import { Certainty } from './IDiagnosis';

export interface IReferral {
  id: ID;
  referralNumber: string;
  practitioner: string;
  referredFacility: string;
  referredDepartment: string;
  date: Date;
  patient: Patient;
  notes: string;
  certainty: Certainty;
  diagnosis: ReferenceData;
}
