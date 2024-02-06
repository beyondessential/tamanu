import { Entity, OneToOne, JoinColumn, RelationId, Column, OneToMany } from 'typeorm/browser';

import {
  IProgramRegistry,
  IPatientProgramRegistration,
  IProgramRegistryCondition,
  ID,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { ProgramRegistryCondition } from './ProgramRegistryCondition';

@Entity('program_registry')
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

  @OneToMany<ProgramRegistryCondition>(
    () => ProgramRegistryCondition,
    ({ programRegistry }) => programRegistry,
  )
  ProgramRegistryConditions: IProgramRegistryCondition[];

  @OneToOne(() => Program)
  @JoinColumn()
  program: Program;

  @RelationId<Program>(({ program }) => program)
  programId: ID;

  static getTableNameForSync(): string {
    return 'program_registries';
  }
}
