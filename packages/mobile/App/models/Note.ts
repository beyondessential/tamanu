import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { DateStringColumn } from './DateColumns';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';

import { DateString, ID, INote, IUser, NoteRecordType } from '~/types';
import { SYNC_DIRECTIONS } from './types';

import { BaseModel, IdRelation } from './BaseModel';
import { User } from './User';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('notes')
export class Note extends BaseModel implements INote {
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;

  @ReferenceDataRelation()
  noteType: ReferenceData;
  @IdRelation()
  noteTypeId: string;

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

  @ManyToOne(() => User, (user) => user.authoredNotes)
  author?: IUser;
  @RelationId(({ author }) => author)
  authorId?: ID;

  @ManyToOne(() => User, (user) => user.onBehalfOfNotes)
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

  static async createForRecord({ recordId, recordType, noteTypeId, content, author }): Promise<Note> {
    return Note.createAndSaveOne<Note>({
      recordId,
      recordType,
      noteTypeId,
      date: getCurrentDateTimeString(),
      content,
      author,
    });
  }
}
