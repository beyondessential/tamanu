import { Entity, ManyToOne, RelationId } from 'typeorm/browser';

import {
  DateTimeString,
  IPatientProgramRegistrationCondition,
  ID,
  IPatient,
  IProgramRegistry,
  IUser,
  IProgramRegistryCondition,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ProgramRegistry } from './ProgramRegistry';
import { Patient } from './Patient';
import { Facility } from './Facility';
import { User } from './User';
import { DateTimeStringColumn } from './DateColumns';

@Entity('patient_program_registration_condition')
export class PatientProgramRegistrationCondition extends BaseModel
  implements IPatientProgramRegistrationCondition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  id: ID;
  @DateTimeStringColumn()
  date: DateTimeString;

  // TODO: enum, see how it's implemented after this project is completed:
  // https://linear.app/bes/issue/EPI-554/deletion-data-tasks
  deletionStatus?: string;
  @DateTimeStringColumn()
  deletionDate?: DateTimeString;

  // Relations
  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId<PatientProgramRegistrationCondition>(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @ManyToOne(() => Patient)
  patient: IPatient;
  @RelationId<PatientProgramRegistrationCondition>(({ patient }) => patient)
  patientId: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  programRegistryCondition?: IProgramRegistryCondition;
  @RelationId<PatientProgramRegistrationCondition>(
    ({ programRegistryCondition }) => programRegistryCondition,
  )
  programRegistryConditionId?: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  clinician?: IUser;
  @RelationId<PatientProgramRegistrationCondition>(({ clinician }) => clinician)
  clinicianId?: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  deletionClinician?: IUser;
  @RelationId<PatientProgramRegistrationCondition>(({ deletionClinician }) => deletionClinician)
  deletionClinicianId?: ID;
}
