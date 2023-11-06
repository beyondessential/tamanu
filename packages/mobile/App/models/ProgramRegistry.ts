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

@Entity('lab_test_panel_request')
export class ProgramRegistry extends BaseModel implements IProgramRegistry {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name?: string;

  @Column({ default: VisibilityStatus.Current, nullable: true })
  visibilityStatus: VisibilityStatus;

  // TODO: Make this an enum
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
  @RelationId<ProgramRegistry>(({ program }) => program)
  programId: ID;
}
