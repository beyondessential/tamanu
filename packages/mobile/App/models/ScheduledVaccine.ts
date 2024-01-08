import { Entity, Column, OneToMany, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AdministeredVaccine } from './AdministeredVaccine';
import { IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('scheduled_vaccine')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  index?: number;

  @Column({ nullable: true })
  label?: string;

  @Column({ nullable: true })
  schedule?: string;

  @Column({ nullable: true })
  weeksFromBirthDue?: number;

  @Column({ nullable: true })
  weeksFromLastVaccinationDue?: number;

  @Column({ nullable: true })
  category?: string;

  @ReferenceDataRelation()
  vaccine: ReferenceData
  @RelationId(({ vaccine }) => vaccine)
  vaccineId: string;

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.scheduledVaccine)
  administeredVaccines: AdministeredVaccine[];

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;
}
