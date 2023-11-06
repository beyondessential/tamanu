import { Entity, ManyToOne, RelationId, Column } from 'typeorm/browser';

import {
  DateTimeString,
  IPatientProgramRegistrationCondition,
  ID,
  IFacility,
  IPatient,
  IProgramRegistry,
  IProgramRegistryClinicalStatus,
  IReferenceData,
  IUser,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ProgramRegistry } from './ProgramRegistry';
import { Patient } from './Patient';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { NullableReferenceDataRelation } from './ReferenceData';
import { Facility } from './Facility';
import { User } from './User';

@Entity('patient_program_registration_condition')
export class PatientProgramRegistrationCondition extends BaseModel
  implements IPatientProgramRegistrationCondition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

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

  // TODO: emum
  // @Column({ default: VisibilityStatus.Current, nullable: true })
  // visibilityStatus: VisibilityStatus;
  @Column({ nullable: false })
  registrationStatus: string;

  date: DateTimeString;

  // Relations
  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId<PatientProgramRegistration>(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @ManyToOne(() => Patient)
  patient: IPatient;
  @RelationId<PatientProgramRegistration>(({ patient }) => patient)
  patientId: ID;

  @ManyToOne(() => ProgramRegistryClinicalStatus, undefined, { nullable: true })
  programRegistryClinicalStatus?: IProgramRegistryClinicalStatus;
  @RelationId<PatientProgramRegistration>(
    ({ programRegistryClinicalStatus }) => programRegistryClinicalStatus,
  )
  programRegistryClinicalStatusId?: ID;

  @NullableReferenceDataRelation()
  village?: IReferenceData;
  @RelationId<PatientProgramRegistration>(({ village }) => village)
  villageId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  facility?: IFacility;
  @RelationId<PatientProgramRegistration>(({ facility }) => facility)
  facilityId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  registeringFacility?: IFacility;
  @RelationId<PatientProgramRegistration>(({ registeringFacility }) => registeringFacility)
  registeringFacilityId?: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  clinician?: IUser;
  @RelationId<PatientProgramRegistration>(({ clinician }) => clinician)
  clinicianId?: ID;
}
