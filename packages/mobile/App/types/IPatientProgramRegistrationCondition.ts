import type { ID } from './ID';
import type { DateTimeString } from './DateString';
import type { IUser } from '.';
import type { IProgramRegistryCondition } from './IProgramRegistryCondition';
import type { IProgramRegistryConditionCategory } from './IProgramRegistryConditionCategory';
import type { IPatientProgramRegistration } from './IPatientProgramRegistration';

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
