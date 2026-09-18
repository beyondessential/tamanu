import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { IFacility } from '../types';
import { BaseModel } from './BaseModel';
import { Department } from './Department';
import { Location } from './Location';
import { SensitiveNetwork } from './SensitiveNetwork';
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

  // A facility is sensitive exactly when it belongs to a network. Declared as a column rather than
  // a @RelationId so it can be filtered on: TypeORM does not treat a relation id as a column.
  @Column({ type: 'varchar', nullable: true })
  sensitiveNetworkId?: string;

  @ManyToOne(() => SensitiveNetwork, { nullable: true })
  @JoinColumn({ name: 'sensitiveNetworkId' })
  sensitiveNetwork?: SensitiveNetwork;

  @OneToMany(() => Location, ({ facility }) => facility)
  locations: Location[];

  @OneToMany(() => Department, ({ facility }) => facility)
  departments: Department[];
}
