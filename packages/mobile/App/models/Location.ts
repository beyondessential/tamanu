import { Column, OneToMany, RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { ILocation } from '../types';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { Facility } from './Facility';
import { AdministeredVaccine } from './AdministeredVaccine';

@Entity('location')
export class Location extends BaseModel implements ILocation {
  code: string;

  name: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  @OneToMany(() => Encounter, ({ location }) => location)
  encounters: Location[];

  @OneToMany(() => AdministeredVaccine, (administeredVaccine) => administeredVaccine.location)
  administeredVaccines: AdministeredVaccine[];
}
