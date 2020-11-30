import { ID } from './ID';
import { Certainty } from './IDiagnosis';
import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';
import { IUser } from './IUser';

export interface IReferral {
  id: ID;
  referralNumber: string;
  referredFacility: string;
  referredDepartment: string;
  notes: string;
  date: Date;
  practitioner: IUser;
  patient: IPatient;
  certainty: Certainty;
  diagnosis: IReferenceData;
}
