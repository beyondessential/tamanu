import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('local_system_facts')
export class LocalSystemFact extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  @Column({ nullable: false })
  key: string;

  @Column({ nullable: false })
  value: string;
}
