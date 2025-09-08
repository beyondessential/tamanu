import { Column, Entity, OneToMany } from 'typeorm';
import { IFacility } from '../types';
import { BaseModel } from './BaseModel';
import { Department } from './Department';
import { Location } from './Location';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';

@Entity('facilities')
export class Facility extends BaseModel implements IFacility {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  code?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  contactNumber?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  streetAddress?: string;

  @Column({ nullable: true })
  cityTown?: string;

  @Column({ nullable: true })
  division?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  @Column({ nullable: false, default: false })
  isSensitive: boolean;

  @OneToMany(() => Location, ({ facility }) => facility)
  locations: Location[];

  @OneToMany(() => Department, ({ facility }) => facility)
  departments: Department[];
}
