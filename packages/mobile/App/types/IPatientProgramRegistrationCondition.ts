import { ID } from './ID';
import { DateTimeString } from './DateString';
import { IFacility, IPatient, IReferenceData, IUser } from '.';
import { IProgramRegistry } from './IProgramRegistry';
import { IProgramRegistryCondition } from './IProgramRegistryCondition';

export interface IPatientProgramRegistrationCondition {
  id: ID;
  date: DateTimeString;
  // TODO: emum
  deletionStatus?: string;
  deletionDate?: DateTimeString;


  programRegistryId: ID;
  programRegistry: IProgramRegistry;

  patientId: ID;
  patient: IPatient;
  
  programRegistryConditionId?: ID;
  programRegistryCondition?: IProgramRegistryCondition;
  
  clinicianId?: ID;
  clinician?: IUser;

  deletionClinicianId?: ID;
  deletionClinician?: IUser;
}
