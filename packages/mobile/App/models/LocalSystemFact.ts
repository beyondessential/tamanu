import { Entity, Column } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('local_system_fact')
export class LocalSystemFact extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  @Column({ nullable: false })
  key: string;

  @Column({ nullable: false })
  value: string;
}
