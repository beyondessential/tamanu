import { Column, Entity, OneToMany } from 'typeorm/browser';
import { IFacility } from '../types';
import { BaseModel } from './BaseModel';
import { Department } from './Department';
import { Location } from './Location';

@Entity('facility')
export class Facility extends BaseModel implements IFacility {
  code: string;

  name: string;

  @Column({ nullable: true })
  division?: string;

  @Column({ nullable: true })
  type?: string;

  @OneToMany(() => Location, ({ facility }) => facility)
  locations: Location[];

  @OneToMany(() => Department, ({ facility }) => facility)
  departments: Department[];
}
