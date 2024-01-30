import { Entity, ManyToOne, RelationId, Column } from 'typeorm/browser';

import {
  DateTimeString,
  ID,
  IFacility,
  IPatient,
  IPatientProgramRegistration,
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
import { RegistrationStatus } from '~/constants/programRegistries';
import { DateTimeStringColumn } from './DateColumns';

@Entity('patient_program_registrations')
export class PatientProgramRegistration extends BaseModel implements IPatientProgramRegistration {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar', nullable: false, default: RegistrationStatus.Active })
  registrationStatus: RegistrationStatus;

  @DateTimeStringColumn()
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
  clinicalStatus?: IProgramRegistryClinicalStatus;
  @RelationId<PatientProgramRegistration>(({ clinicalStatus }) => clinicalStatus)
  clinicalStatusId?: ID;

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

  dateRemoved: DateTimeString;

  // @ManyToOne(() => User, undefined, { nullable: true })
  removedBy?: IUser;

  // @RelationId<PatientProgramRegistration>(({ clinician }) => clinician)
  removedById?: ID;

  static getTableNameForSync(): string {
    return 'patient_program_registrations';
  }
}
