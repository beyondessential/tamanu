import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { IPatientProgramRegistrationCondition } from './IPatientProgramRegistrationCondition';
import type { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryCondition {
  id: ID;
  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;
  programRegistryId: ID;
  programRegistry: IProgramRegistry;
  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];
}
