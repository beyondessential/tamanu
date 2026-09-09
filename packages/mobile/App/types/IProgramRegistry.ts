import type { VisibilityStatus } from '~/visibilityStatuses';
import type { CurrentlyAtType } from '~/constants/programRegistries';
import type { IProgram } from './IProgram';
import type { ID } from './ID';
import type { IProgramRegistryClinicalStatus } from './IProgramRegistryClinicalStatus';
import type { IPatientProgramRegistration } from './IPatientProgramRegistration';
import type { IPatientProgramRegistrationCondition } from './IPatientProgramRegistrationCondition';

export interface IProgramRegistry {
  id: ID;
  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;
  currentlyAtType: CurrentlyAtType;
  programId: ID;
  program: IProgram;
  clinicalStatuses: IProgramRegistryClinicalStatus[];
  patientProgramRegistrations: IPatientProgramRegistration[];
  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];
}
