import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

// spec: CAS
// The local blob registry: one row per content-addressed blob held in this
// device's on-disk blob store, keyed by algorithm-tagged hash. A cache index —
// local to the device, never synced.
@Entity('blobs')
export class Blob extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  @Column({ nullable: false, unique: true })
  hash: string;

  @Column({ type: 'bigint', nullable: false })
  size: number;

  @Column({ nullable: false, default: 'verified' })
  integrityState: string;
}
