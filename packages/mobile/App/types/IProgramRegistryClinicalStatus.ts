import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { IPatientProgramRegistration } from './IPatientProgramRegistration';
import type { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryClinicalStatus {
  id: ID;
  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;
  color?: string;
  programRegistryId: ID;
  programRegistry: IProgramRegistry;
  patientProgramRegistrations: IPatientProgramRegistration[];
}
