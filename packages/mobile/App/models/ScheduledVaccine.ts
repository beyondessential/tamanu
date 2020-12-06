import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';

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

  @ManyToOne(
    type => ReferenceData,
    { eager: true },
  )
  vaccine: ReferenceData;
}
