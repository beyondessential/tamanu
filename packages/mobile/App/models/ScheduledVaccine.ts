import { Column, Entity, OneToMany, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { AdministeredVaccine } from './AdministeredVaccine';
import { IScheduledVaccine } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('scheduled_vaccines')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  index?: number;

  @Column({ nullable: true })
  label?: string;

  @Column({ nullable: true })
  doseLabel?: string;

  @Column({ nullable: true })
  weeksFromBirthDue?: number;

  @Column({ nullable: true })
  weeksFromLastVaccinationDue?: number;

  @Column({ nullable: true })
  category?: string;

  @ReferenceDataRelation()
  vaccine: ReferenceData;
  @RelationId(({ vaccine }) => vaccine)
  vaccineId: string;

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.scheduledVaccine)
  administeredVaccines: AdministeredVaccine[];

  @Column({ default: false })
  hideFromCertificate: boolean;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: VisibilityStatus;

  @Column({ default: 0 })
  sortIndex: number;
}
