import { ID } from './ID';
import { IProgramRegistryClinicalStatus } from './IProgramRegistryClinicalStatus';
import { DateTimeString } from './DateString';
import { IFacility, IPatient, IReferenceData, IUser } from '.';
import { IProgramRegistry } from './IProgramRegistry';
import { RegistrationStatus } from '~/constants/programRegistries';

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
}
