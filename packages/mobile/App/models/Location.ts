import { Column, OneToMany, RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { ILocation } from '../types';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { Facility } from './Facility';
import { AdministeredVaccine } from './AdministeredVaccine';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';
import { readConfig } from '~/services/config';

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

  static async getOrCreateDefaultLocation(): Promise<Location> {
    const repo = this.getRepository();
    const facilityId = await readConfig('facilityId', '');

    const defaultLocation = await repo.findOne({
      where: { facility: { id: facilityId } },
    });

    if (defaultLocation) {
      return defaultLocation;
    }

    return Location.createAndSaveOne({
      code: 'GeneralClinic',
      name: 'General Clinic',
      facilityId,
    });
  }
}
