import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

// spec: AV
// A hash known to name malware. Central scans and its verdict is authoritative,
// so these are pulled here rather than reached independently: the device runs no
// scanner. Content-addressed, so it stands whether or not this device holds the
// bytes, and it still stands if a copy arrives later.
@Entity('blob_quarantines')
export class BlobQuarantine extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false, unique: true })
  hash: string;

  @Column({ nullable: true })
  scannerVersion: string;

  @Column({ nullable: true })
  signatureVersion: string;
}
