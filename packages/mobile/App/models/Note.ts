import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';

import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { DateStringColumn } from './DateColumns';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';

import { ID, IUser, INote, NoteRecordType, NoteType, DateString } from '~/types';
import { SYNC_DIRECTIONS } from './types';

import { BaseModel } from './BaseModel';
import { User } from './User';
import { LegacyNotePage } from './LegacyNotePage';

@Entity('note')
export class Note extends BaseModel implements INote {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar', nullable: false })
  noteType: NoteType;

  @DateStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: DateString;

  @Column({ type: 'varchar', nullable: false })
  recordType: NoteRecordType;

  // Note: we can't create an OOM relation here as the recordId
  // could refer to several different models
  @Column({ type: 'varchar', nullable: false })
  recordId: ID;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  revisedById?: string;

  @ManyToOne(
    () => User,
    user => user.authoredNoteItems,
  )
  author?: IUser;
  @RelationId(({ author }) => author)
  authorId?: ID;

  @ManyToOne(
    () => User,
    user => user.onBehalfOfNoteItems,
  )
  onBehalfOf?: IUser;
  @RelationId(({ onBehalfOf }) => onBehalfOf)
  onBehalfOfId?: ID;

  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.content) {
      throw new Error('Note: Content must not be empty');
    }
  }

  static async createForRecord({ recordId, recordType, noteType, content, author }): Promise<Note> {
    return Note.createAndSaveOne<Note>({
      recordId,
      recordType,
      noteType,
      date: getCurrentDateTimeString(),
      content,
      author,
    });
  }

  static getTableNameForSync(): string {
    return 'notes';
  }
}
