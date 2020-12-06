import { Entity, Column } from 'typeorm/browser';
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

  @ReferenceDataRelation()
  vaccine: ReferenceData;
}
