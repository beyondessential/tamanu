import { ID } from './ID';
import { IPatient } from './IPatient';

export interface IReferralAnswer {
  id: ID;
  referralId: ID;
  questionId: ID;
  referral: IReferral;
  answer?: string;
}

export interface IReferral {
  id: ID;
  patientId: ID;
  patient: IPatient;
  answers: IReferralAnswer[];
}
