import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel';
import { INotePage } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { LabTest } from './LabTest';
import { User } from './User';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';
import { DateTimeStringColumn } from './DateColumns';

@Entity('notePage')
export class NoteItem extends BaseModel implements INoteItem {
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;

  // id: ID;
  @DateTimeStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT });
  date: DateString;
  content: string;

  // Not sure what this does exactly
  revisedById?: string;

  notePage: INotePage
  notePageId: ID;

  @ManyToOne(
    () => User,
    user => user.labRequests,
  )
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById: string;
  author: IUser;
  authorId: ID;

  onBehalfOf: IUser;
  onBehalfOfId: ID;
}
