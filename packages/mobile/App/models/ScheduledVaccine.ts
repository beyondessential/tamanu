import { Entity, Column, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';
import { AdministeredVaccine } from './AdministeredVaccine';

@Entity('scheduled_vaccine')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
  @Column()
  index: number;

  @Column()
  label: string;

  @Column()
  schedule: string;

  @Column()
  category: string;

  @OneToMany(
    type => AdministeredVaccine,
    administeredVaccine => administeredVaccine.scheduledVaccine,
  )
  administeredVaccine: AdministeredVaccine;

  @ReferenceDataRelation()
  vaccine: ReferenceData;
}
