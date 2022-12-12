import { Entity, Column, AfterLoad } from 'typeorm/browser';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { readFileInDocuments } from '../ui/helpers/file';

@Entity('attachment')
export class Attachment extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;

  @Column({ nullable: true })
  size?: number; //size in bytes

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'blob', nullable: true })
  data: Buffer;

  @Column()
  filePath: string; // will not be synced up, only for local usage

  static uploadLimit = 1;

  @AfterLoad()
  async populateDataFromPath(): Promise<void> {
    // Sqlite cannot handle select query with very large blob.
    // So this is a work around to avoid that.
    // 'data' will also be synced up.
    // Ideally, with file compressing, attachments should not
    // be too large, but this is just in case.
    if (this.filePath) {
      const base64 = await readFileInDocuments(this.filePath);
      this.data = Buffer.from(base64, 'base64');
    }
  }

  // TODOs
  // - only sync attachments that are actually associated with a survey response, not orphans
  // - clean up attachments after they've been synced to the central server
  // for original code, see https://github.com/beyondessential/tamanu/commit/c8f5891159733b8da5571ca301dead1fbd52ac1e

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'filePath'];
}
