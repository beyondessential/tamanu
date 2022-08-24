import { Entity, Column } from 'typeorm/browser';

import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { AfterLoad } from 'typeorm';
import { SyncRecordData } from '~/services/sync';

@Entity('session_sync_record')
export class SessionSyncRecord extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  @Column({ nullable: true })
  recordId: string;

  @Column({ nullable: false })
  recordType: string;

  @Column({ nullable: true })
  isDeleted: boolean;

  @Column({ nullable: false })
  data: string;

  dataJson: SyncRecordData

  @AfterLoad()
  convertRecordDataToJson(): any {
    try {
      // sqlite unfortunately does not have JSON type, so this is a work around
      this.dataJson = JSON.parse(this.data);
    } catch (e) {
      console.warn(`Invalid data in Session Sync Record ${this.id}`);
      return {};
    }
  }
}
