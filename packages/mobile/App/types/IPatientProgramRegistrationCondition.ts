import { ID } from './ID';
import { DateTimeString } from './DateString';
import { IUser } from '.';
import { IProgramRegistryCondition } from './IProgramRegistryCondition';
import { IProgramRegistryConditionCategory } from './IProgramRegistryConditionCategory';
import { IPatientProgramRegistration } from './IPatientProgramRegistration';

export interface IPatientProgramRegistrationCondition {
  id: ID;
  date: DateTimeString;
  deletionDate?: DateTimeString;
  reasonForChange?: string;

  programRegistryConditionCategoryId: ID;
  programRegistryConditionCategory: IProgramRegistryConditionCategory;

  patientProgramRegistrationId: ID;
  patientProgramRegistration: IPatientProgramRegistration;

  programRegistryConditionId?: ID;
  programRegistryCondition?: IProgramRegistryCondition;

  clinicianId?: ID;
  clinician?: IUser;

  deletionClinicianId?: ID;
  deletionClinician?: IUser;
}
