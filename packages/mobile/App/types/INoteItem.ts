import { ID } from './ID';
import { INotePage } from './INotePage';
import { IUser } from './IUser';
import { DateTimeString } from './DateString';

export interface INoteItem {
  id: ID;
  date: DateTimeString;
  content: string;

  revisedById?: string;

  notePage: INotePage
  notePageId: ID;

  author?: IUser;
  authorId?: ID;

  onBehalfOf?: IUser;
  onBehalfOfId?: ID;
}
