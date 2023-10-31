import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IPatientProgramRegistrationCondition } from './IPatientProgramRegistrationCondition';
import { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryCondition {
  id: ID;
  code: string;
  name: string;
  visibilityStatus: VisibilityStatus;

  programRegistryId: ID;
  programRegistry: IProgramRegistry;

  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];
}
