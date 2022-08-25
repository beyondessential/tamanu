import { Column, OneToMany, RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { ILocation } from '../types';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { Facility } from './Facility';
import { AdministeredVaccine } from './AdministeredVaccine';
import { VisibilityStatus } from '../visibilityStatuses';

@Entity('location')
export class Location extends BaseModel implements ILocation {
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

  @OneToMany(() => Encounter, ({ location }) => location)
  encounters: Location[];

  @OneToMany(() => AdministeredVaccine, (administeredVaccine) => administeredVaccine.location)
  administeredVaccines: AdministeredVaccine[];
}
