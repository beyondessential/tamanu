import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import {
  IProgramRegistry,
  IPatientProgramRegistration,
  IPatientProgramRegistrationCondition,
  ID,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { PatientProgramRegistrationCondition } from './PatientProgramRegistrationCondition';

@Entity('program_registries')
export class ProgramRegistry extends BaseModel implements IProgramRegistry {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name?: string;

  @Column({ type: 'varchar', default: VisibilityStatus.Current, nullable: true })
  visibilityStatus: VisibilityStatus;

  // TODO: Make this an enum
  @Column({ nullable: false })
  currentlyAtType: string;

  @OneToMany<ProgramRegistryClinicalStatus>(
    () => ProgramRegistryClinicalStatus,
    ({ programRegistry }) => programRegistry,
  )
  clinicalStatuses: ProgramRegistryClinicalStatus[];

  @OneToMany<PatientProgramRegistration>(
    () => PatientProgramRegistration,
    ({ programRegistry }) => programRegistry,
  )
  patientProgramRegistrations: IPatientProgramRegistration[];

  @OneToMany<PatientProgramRegistrationCondition>(
    () => PatientProgramRegistrationCondition,
    ({ programRegistry }) => programRegistry,
  )
  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];

  @ManyToOne(() => Program)
  program: Program;

  @RelationId<Program>(({ program }) => program)
  programId: ID;

  static getTableNameForSync(): string {
    return 'program_registries';
  }
}
