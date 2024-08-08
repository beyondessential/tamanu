import { RelationId } from 'typeorm';
import { BeforeInsert, Entity, ManyToOne, PrimaryColumn } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { SYNC_DIRECTIONS } from './types';
import { User } from './User';

@Entity('user_facility')
export class UserFacility extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User)
  user: User;

  @RelationId(({ user }) => user)
  userId: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  static getTableNameForSync(): string {
    return 'user_facilities';
  }
}
