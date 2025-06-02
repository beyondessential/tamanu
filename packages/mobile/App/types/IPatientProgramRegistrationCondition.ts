import { ID } from './ID';
import { DateTimeString } from './DateString';
import { IUser } from '.';
import { IProgramRegistryCondition } from './IProgramRegistryCondition';
import { IPatientProgramRegistration } from './IPatientProgramRegistration';

export interface IPatientProgramRegistrationCondition {
  id: ID;
  date: DateTimeString;
  deletionDate?: DateTimeString;
  conditionCategory: string;
  reasonForChange?: string;

  patientProgramRegistrationId: ID;
  patientProgramRegistration: IPatientProgramRegistration;

  programRegistryConditionId?: ID;
  programRegistryCondition?: IProgramRegistryCondition;

  clinicianId?: ID;
  clinician?: IUser;

  deletionClinicianId?: ID;
  deletionClinician?: IUser;
}
