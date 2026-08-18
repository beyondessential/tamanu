import type { ID } from './ID';
import type { IProgramRegistryClinicalStatus } from './IProgramRegistryClinicalStatus';
import type { DateTimeString } from './DateString';
import type { IFacility, IPatient, IReferenceData, IUser } from '.';
import type { IProgramRegistry } from './IProgramRegistry';
import type { RegistrationStatus } from '~/constants/programRegistries';
import type { IPatientProgramRegistrationCondition } from './IPatientProgramRegistrationCondition';

export interface IPatientProgramRegistration {
  id: ID;
  date: DateTimeString;

  registrationStatus: RegistrationStatus;

  programRegistryId: ID;
  programRegistry: IProgramRegistry;

  patientId: ID;
  patient: IPatient;

  clinicalStatusId?: ID;
  clinicalStatus?: IProgramRegistryClinicalStatus;

  clinicianId: ID;
  clinician: IUser;

  registeringFacilityId?: ID;
  registeringFacility?: IFacility;

  facilityId?: ID;
  facility?: IFacility;

  villageId?: ID;
  village?: IReferenceData;

  deactivatedClinicianId?: ID;
  deactivatedClinician?: IUser;

  deactivatedDate?: DateTimeString;

  conditions: IPatientProgramRegistrationCondition[];
}
