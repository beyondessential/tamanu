import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import { IProgramRegistry, IPatientProgramRegistration } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';
import { PatientProgramRegistration } from './PatientProgramRegistration';
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

  // patientProgramRegistrations: IPatientProgramRegistration[];

  // patientProgramRegistrationConditions: IPatientProgramRegistrationCondition[];

  @ManyToOne(() => Program)
  program: Program;
  @RelationId<ProgramRegistry>(({ program }) => program)
  programId: string;
}

// // type hi = string | ((object: unknown) => any);
// type hi2 = typeof RelationId; //(param: unknown) => string;
// const myFn2: hi2 = (x) => '';
// // type hi = (object: unknown) => any;

// function myFn<T>(param: string | ((object: T) => any)) {
//   console.log(param);
// }

// interface XX {
//   x: string;
// }
// myFn<XX>(({ x }) => x);

// function myDec<T>(param: string | ((object: T) => any)) {
//   console.log("first(): factory evaluated", param);
//   return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     console.log("first(): called", param);
//   };
// }
// function myDec(target: Object, propertyKey: string | symbol, parameterIndex: number) {
//   let existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
//   existingRequiredParameters.push(parameterIndex);
//   Reflect.defineMetadata( requiredMetadataKey, existingRequiredParameters, target, propertyKey);
// }

// class Testing {
//   @myDec<XX>(({ x }) => x)
//   hello: string;
// }
