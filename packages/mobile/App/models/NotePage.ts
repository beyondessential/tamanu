import { Entity, Column, OneToMany } from 'typeorm/browser';

import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { DateStringColumn } from './DateColumns';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';

import { ID, INoteItem, INotePage, NoteRecordType, NoteType, DateString } from '~/types';
import { SYNC_DIRECTIONS } from './types';

import { BaseModel } from './BaseModel';
import { NoteItem } from './NoteItem';

@Entity('notePage')
export class NotePage extends BaseModel implements INotePage {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar', nullable: false })
  noteType: NoteType;

  @DateStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: DateString;

  // Can't link to record
  @Column({ type: 'varchar', nullable: false })
  recordType: NoteRecordType;
  @Column({ type: 'varchar', nullable: false })
  recordId: ID;

  @OneToMany(() => NoteItem, noteItem => noteItem.notePage)
  noteItems: INoteItem[];

  static getTableNameForSync(): string {
    return 'note_pages'; // unusual camel case table here on mobile
  }

  static async createForRecord({recordId, recordType, noteType, content, authorId}) {
    const notePage = await NotePage.createAndSaveOne({
      recordId,
      recordType,
      noteType,
      date: getCurrentDateTimeString(),
    });
    console.log(notePage.id, authorId);

    await NoteItem.createAndSaveOne({
      notePage: notePage.id,
      content,
      date: getCurrentDateTimeString(),
      author: authorId,
    });

    return notePage;
  }
}
