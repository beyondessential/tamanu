import { Column, RelationId, OneToMany } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { IDepartment } from '../types';
import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { AdministeredVaccine } from './AdministeredVaccine';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('department')
export class Department extends BaseModel implements IDepartment {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ default: '' })
  code: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  @OneToMany(
    () => AdministeredVaccine,
    administeredVaccine => administeredVaccine.department,
  )
  administeredVaccines: AdministeredVaccine[];
}
