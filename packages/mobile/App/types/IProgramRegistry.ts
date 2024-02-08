import { VisibilityStatus } from '~/visibilityStatuses';
import { CurrentlyAtType } from '~/constants/programRegistries';
import { IProgram } from './IProgram';
import { ID } from './ID';
import { IProgramRegistryClinicalStatus } from './IProgramRegistryClinicalStatus';
import { IPatientProgramRegistration } from './IPatientProgramRegistration';
import { IPatientProgramRegistrationCondition } from './IPatientProgramRegistrationCondition';

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
