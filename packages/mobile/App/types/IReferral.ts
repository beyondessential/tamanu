import { Diagnosis, Patient, ReferenceData, User } from '~/models';
import { ID } from './ID';
import { Certainty } from './IDiagnosis';

export interface IReferral {
  id: ID;
  referralNumber: string;
  referredFacility: string;
  referredDepartment: string;
  notes: string;
  date: Date;
  practitioner: User;
  patient: Patient;
  certainty: Certainty;
  diagnosis: ReferenceData;
}
