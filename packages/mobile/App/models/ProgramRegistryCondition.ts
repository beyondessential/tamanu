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
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';

@Entity('program_registry_condition')
export class ProgramRegistryCondition extends BaseModel implements IProgramRegistryCondition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ default: VisibilityStatus.Current, nullable: true })
  visibilityStatus: VisibilityStatus;

  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId<ProgramRegistryClinicalStatus>(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @OneToMany<PatientProgramRegistrationCondition>(
    () => PatientProgramRegistrationCondition,
    ({ programRegistryClinicalStatus }) => programRegistryClinicalStatus,
  )
  patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];
}
