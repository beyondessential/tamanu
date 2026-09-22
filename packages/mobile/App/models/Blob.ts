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

  // spec: CACHE
  // Durability tier: an outbox blob is the only durable copy, never evicted; a
  // cache blob is durable on central and evictable under the LRU size budget.
  @Column({ nullable: false, default: 'cache' })
  tier: string;

  // spec: CACHE
  // LRU recency: set at admission, refreshed (possibly coalesced) on reads.
  @Column({ type: 'datetime', nullable: false, default: () => "datetime('now')" })
  lastAccessedAt: Date;

  // spec: SCRUB
  // When the content was last confirmed to match its hash. Set at admission,
  // where the content is hashed anyway, and refreshed by read verification. Null
  // means never confirmed, so the next read verifies.
  @Column({ type: 'datetime', nullable: true })
  lastVerifiedAt: Date;

  // spec: CAP
  // The push cursor when this blob first became eligible for push; null until
  // then, cleared on demotion to cache. The outbox dysfunction measure compares
  // it against the current push cursor.
  @Column({ type: 'bigint', nullable: true })
  eligibleSinceTick: number;
}
