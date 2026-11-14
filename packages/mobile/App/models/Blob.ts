import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

// spec: CAS
// Local to the device, never synced.
@Entity('blobs')
export class Blob extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  @Column({ nullable: false, unique: true })
  hash: string;

  @Column({ type: 'bigint', nullable: false })
  size: number;

  @Column({ nullable: false, default: 'verified' })
  integrityState: string;

  // spec: CACHE
  @Column({ nullable: false, default: 'cache' })
  tier: string;

  // spec: CACHE
  // Refreshes may be coalesced.
  @Column({ type: 'datetime', nullable: false, default: () => "datetime('now')" })
  lastAccessedAt: Date;

  // spec: SCRUB
  // Null means never confirmed, so the next read verifies.
  @Column({ type: 'datetime', nullable: true })
  lastVerifiedAt: Date;

  // spec: CAP
  // Cleared on demotion to cache.
  @Column({ type: 'bigint', nullable: true })
  eligibleSinceTick: number;
}
