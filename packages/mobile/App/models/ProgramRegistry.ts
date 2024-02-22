import { Entity, OneToOne, JoinColumn, RelationId, Column, OneToMany } from 'typeorm/browser';
import { PureAbility } from '@casl/ability';

import { IProgramRegistry, ID } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { CurrentlyAtType, RegistrationStatus } from '~/constants/programRegistries';
import { Program } from './Program';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { PatientProgramRegistrationCondition } from './PatientProgramRegistrationCondition';

@Entity('program_registry')
export class ProgramRegistry extends BaseModel implements IProgramRegistry {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', default: VisibilityStatus.Current, nullable: true })
  visibilityStatus?: VisibilityStatus;

  @Column({ type: 'varchar', nullable: false })
  currentlyAtType: CurrentlyAtType;

  @OneToMany<ProgramRegistryClinicalStatus>(
    () => ProgramRegistryClinicalStatus,
    ({ programRegistry }) => programRegistry,
  )
  clinicalStatuses: ProgramRegistryClinicalStatus[];

  @OneToMany<PatientProgramRegistration>(
    () => PatientProgramRegistration,
    ({ programRegistry }) => programRegistry,
  )
  patientProgramRegistrations: PatientProgramRegistration[];

  @OneToMany<PatientProgramRegistrationCondition>(
    () => PatientProgramRegistrationCondition,
    ({ programRegistry }) => programRegistry,
  )
  PatientProgramRegistrationConditions: PatientProgramRegistrationCondition[];

  @OneToOne(() => Program)
  @JoinColumn()
  program: Program;

  @RelationId(({ program }) => program)
  programId: ID;

  static async getProgramRegistriesForPatient(patientId: string, ability: PureAbility) {
    if (ability.can('list', 'ProgramRegistry') === false) return [];

    const subquery = PatientProgramRegistration.getRepository()
      .createQueryBuilder('ppr')
      .leftJoinAndSelect('ppr.programRegistry', 'program_registry')
      .select(['ppr.programRegistryId as id'])
      .distinct(true)
      .where('ppr.patientId = :patientId')
      .andWhere('ppr.registrationStatus != :registrationStatus');

    const programRegistryRepository = this.getRepository(ProgramRegistry);
    const filteredProgramRegistries = await programRegistryRepository
      .createQueryBuilder('pr')
      .where(`pr.id NOT IN (${subquery.getQuery()})`)
      .setParameter('patientId', patientId)
      .setParameter('registrationStatus', RegistrationStatus.RecordedInError);

    return filteredProgramRegistries.getMany();
  }

  static getTableNameForSync(): string {
    return 'program_registries';
  }
}
