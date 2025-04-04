import { Entity, ManyToOne, RelationId, Column } from 'typeorm';

import {
  DateTimeString,
  IPatientProgramRegistrationCondition,
  ID,
  IUser,
  IProgramRegistryCondition,
  IPatientProgramRegistration,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { DateTimeStringColumn } from './DateColumns';
import { ProgramRegistryCondition } from './ProgramRegistryCondition';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { User } from './User';

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
  @ManyToOne(() => PatientProgramRegistration)
  patientProgramRegistration: IPatientProgramRegistration;
  @RelationId(({ patientProgramRegistration }) => patientProgramRegistration)
  patientProgramRegistrationId: ID;

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
