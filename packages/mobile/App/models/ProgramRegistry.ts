import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import { IProgramRegistry } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';

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

  @OneToMany(
    () => ProgramRegistryClinicalStatus,
    ({ programRegistry }) => programRegistry,
  )
  clinicalStatuses: ProgramRegistryClinicalStatus[];


  @OneToMany(
    () => IPatientProgramRegistration,
    ({ programRegistry }) => programRegistry,
  )
  patientProgramRegistrations: IPatientProgramRegistration[];


  // patientProgramRegistrations: IPatientProgramRegistration[];

  // patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];

  @ManyToOne(
    () => Program,
  )
  program: Program;
  @RelationId({ program }) => program)
  programId: string;

}

// type hi = string | ((object: unknown) => any);
type hi2 = typeof RelationId; //(param: unknown) => string;
const myFn2: hi2 = (x) => '';
// type hi = (object: unknown) => any;

function myFn<T>(param: string | ((object: T) => any)) {
  console.log(param);
}

myFn(({ x }) => x);