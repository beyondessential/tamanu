import { Entity, Column, OneToMany, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AdministeredVaccine } from './AdministeredVaccine';
import { IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';
import { VisibilityStatus } from '../visibilityStatuses';

@Entity('scheduled_vaccine')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
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
