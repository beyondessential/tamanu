import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

// spec: AV
// Pulled from central: the device runs no scanner.
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
