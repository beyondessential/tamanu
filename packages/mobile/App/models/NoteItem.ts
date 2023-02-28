import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';

import { DateTimeStringColumn } from './DateColumns';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';

import { ID, INoteItem, INotePage, NoteRecordType, NoteType, DateString, IUser } from '~/types';
import { SYNC_DIRECTIONS } from './types';

import { BaseModel } from './BaseModel';
import { User } from './User';
import { NotePage } from './NotePage';

@Entity('noteItem')
export class NoteItem extends BaseModel implements INoteItem {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
  date: DateString;

  // Content has a default or '' on desktop but errors if that default is set
  // I'm going to assume it was a workaround that isn't needed here
  @Column({ type: 'varchar', nullable: false })
  content: string;

  // Not sure what this does exactly
  @Column({ type: 'varchar', nullable: false })
  revisedById?: string;

  @ManyToOne(() => NotePage, notePage => notePage.noteItems)
  notePage: INotePage;
  @RelationId(({ notePage }) => notePage)
  notePageId: ID;

  @ManyToOne(() => User, user => user.authoredNoteItems)
  author: IUser;
  @RelationId(({ author }) => author)
  authorId: ID;

  @ManyToOne(() => User, user => user.onBehalfOfNoteItems)
  onBehalfOf: IUser;
  @RelationId(({ onBehalfOf }) => onBehalfOf)
  onBehalfOfId: ID;

  static getTableNameForSync(): string {
    return 'note_items'; // unusual camel case table here on mobile
  }
}
