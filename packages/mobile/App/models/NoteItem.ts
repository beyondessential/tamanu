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
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;
  // id: ID;
  @DateTimeStringColumn({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
  date: DateString;
  @Column({ type: 'varchar', nullable: false })
  content: string;

  // Not sure what this does exactly
  @Column({ type: 'varchar', nullable: false })
  revisedById?: string;

  // @ManyToOne(() => NotePage, notePage => notePage.noteItems, { nullable: false }) // Idea
  @ManyToOne(() => NotePage, notePage => notePage.noteItems)
  notePage: INotePage;
  @RelationId(({ notePage }) => notePage)
  notePageId: ID;

  @ManyToOne(() => User, user => user.requestedNoteItems)
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById: string;

  @ManyToOne(() => User, user => user.authoredNoteItems)
  author: IUser;
  @RelationId(({ author }) => author)
  authorId: ID;

  onBehalfOf: IUser;
  onBehalfOfId: ID;
}
