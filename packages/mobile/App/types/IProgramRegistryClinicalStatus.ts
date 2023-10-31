import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IPatientProgramRegistration } from './IPatientProgramRegistration';
import { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryClinicalStatus {
  id: ID;
  code: string;
  name: string;
  visibilityStatus: VisibilityStatus;

  color: string;


  programRegistryId: ID;
  programRegistry: IProgramRegistry;

  patientProgramRegistrations: IPatientProgramRegistration[];
}
