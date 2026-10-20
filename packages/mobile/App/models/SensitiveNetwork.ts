import { Column, Entity } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

// A named group of facilities that share confidential data. Mobile holds the records so a
// facility's membership resolves to something, and reads membership to decide facility access.
// spec: specs/sync/sensitive-networks.md
@Entity('sensitive_networks')
export class SensitiveNetwork extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ default: '' })
  code: string;

  @Column({ default: '' })
  name: string;
}
