import { RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { IDepartment } from '../types';
import { BaseModel } from './BaseModel';
import { Facility } from './Facility';

@Entity('department')
export class Department extends BaseModel implements IDepartment {
  code: string;

  name: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;
}
