import { ID } from './ID';
import { INotePage } from './INotePage';
import { IUser } from './IUser';
// import { IReferenceData } from './IReferenceData';
import { DateTimeString } from './DateString';

export interface INoteItem {
  id: ID;
  date: DateTimeString,
  content: string,

  // Not sure what this does exactly
  revisedById?: string,

  notePage: INotePage
  notePageId: ID,

  author: IUser,
  authorId: ID,

  onBehalfOf: IUser,
  onBehalfOfId: ID,
}

export interface IDataRequiredToCreateNoteItem {}
