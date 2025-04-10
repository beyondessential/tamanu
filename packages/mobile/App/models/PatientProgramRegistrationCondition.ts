import { Entity, ManyToOne, RelationId, Column } from 'typeorm';

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
import { User } from './User';
import { DateTimeStringColumn } from './DateColumns';
import { ProgramRegistryCondition } from './ProgramRegistryCondition';

@Entity('patient_program_registration_conditions')
export class PatientProgramRegistrationCondition
  extends BaseModel
  implements IPatientProgramRegistrationCondition
{
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  id: ID;
  @DateTimeStringColumn()
  date: DateTimeString;

  @DateTimeStringColumn()
  deletionDate?: DateTimeString;

  @Column({ nullable: false, default: 'Unknown' })
  conditionCategory: string;

  @Column({ nullable: true })
  reasonForChange: string;

  // Relations
  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @ManyToOne(() => Patient)
  patient: IPatient;
  @RelationId(({ patient }) => patient)
  patientId: ID;

  @ManyToOne(
    () => ProgramRegistryCondition,
    ({ patientProgramRegistrationConditions }) => patientProgramRegistrationConditions,
    { nullable: true },
  )
  programRegistryCondition?: IProgramRegistryCondition;

  @RelationId(({ programRegistryCondition }) => programRegistryCondition)
  programRegistryConditionId?: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  clinician?: IUser;
  @RelationId(({ clinician }) => clinician)
  clinicianId?: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  deletionClinician?: IUser;
  @RelationId(({ deletionClinician }) => deletionClinician)
  deletionClinicianId?: ID;

  static async findForRegistration(patientProgramRegistrationId: string) {
    const conditionsRepository = this.getRepository();
    return conditionsRepository
      .createQueryBuilder('condition')
      .where('condition.patientProgramRegistrationId = :patientProgramRegistrationId', {
        patientProgramRegistrationId,
      })
      .leftJoinAndSelect('condition.programRegistryCondition', 'programRegistryCondition')
      .getMany();
  }
}
