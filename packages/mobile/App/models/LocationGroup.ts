import { Column, OneToMany, RelationId, Entity, ManyToOne } from 'typeorm';
import { IFacility, ILocationGroup } from '../types';
import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { Location } from './Location';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('location_groups')
export class LocationGroup extends BaseModel implements ILocationGroup {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ default: '' })
  code: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  @ManyToOne(() => Facility)
  facility: IFacility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  @OneToMany(() => Location, ({ locationGroup }) => locationGroup)
  locations: Location[];
}
