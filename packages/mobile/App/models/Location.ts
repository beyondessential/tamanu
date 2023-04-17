import { Column, OneToMany, RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { ILocation } from '../types';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { Facility } from './Facility';
import { LocationGroup } from './LocationGroup';
import { AdministeredVaccine } from './AdministeredVaccine';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('location')
export class Location extends BaseModel implements ILocation {
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
    () => Encounter,
    ({ location }) => location,
  )
  encounters: Location[];

  @OneToMany(
    () => AdministeredVaccine,
    administeredVaccine => administeredVaccine.location,
  )
  administeredVaccines: AdministeredVaccine[];

  @ManyToOne(() => LocationGroup)
  locationGroup: LocationGroup;

  @RelationId(({ locationGroup }) => locationGroup)
  locationGroupId: string;
}
