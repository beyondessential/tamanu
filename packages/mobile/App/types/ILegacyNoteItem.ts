import { ID } from './ID';
import { ILegacyNotePage } from './ILegacyNotePage';
import { IUser } from './IUser';
import { DateTimeString } from './DateString';

export interface ILegacyNoteItem {
  id: ID;
  date: DateTimeString;
  content: string;

  revisedById?: string;

  notePage: ILegacyNotePage
  notePageId: ID;

  author?: IUser;
  authorId?: ID;

  onBehalfOf?: IUser;
  onBehalfOfId?: ID;
}
