import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import {
  ID,
  IPatientProgramRegistrationCondition,
  IProgramRegistry,
  IProgramRegistryCondition,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { PatientProgramRegistrationCondition } from './PatientProgramRegistrationCondition';
import { ProgramRegistry } from './ProgramRegistry';

@Entity('program_registry_condition')
export class ProgramRegistryCondition extends BaseModel implements IProgramRegistryCondition {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', default: VisibilityStatus.Current, nullable: true })
  visibilityStatus?: VisibilityStatus;

  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @OneToMany<PatientProgramRegistrationCondition>(
    () => PatientProgramRegistrationCondition,
    ({ programRegistryClinicalStatus }) => programRegistryClinicalStatus,
  )
  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];

  static getTableNameForSync(): string {
    return 'program_registry_conditions';
  }
}
