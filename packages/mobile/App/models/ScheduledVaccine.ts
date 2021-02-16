import { Entity, Column, OneToMany, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AdministeredVaccine } from './AdministeredVaccine';
import { IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';

@Entity('scheduled_vaccine')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
  @Column({ nullable: true })
  index?: number;

  @Column()
  label: string;

  @Column()
  schedule: string;

  @Column({ nullable: true })
  weeksFromBirthDue?: number;

  @Column()
  category: string;

  @ReferenceDataRelation()
  vaccine: ReferenceData
  @RelationId(({ vaccine }) => vaccine)
  vaccineId?: string;

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.scheduledVaccine)
  administeredVaccines: AdministeredVaccine[];
}
