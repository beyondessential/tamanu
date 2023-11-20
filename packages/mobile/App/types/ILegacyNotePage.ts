import { ID } from './ID';
import { ILegacyNoteItem } from './ILegacyNoteItem';
import { DateString } from './DateString';
import { NoteType, NoteRecordType } from './INote';

export interface ILegacyNotePage {
  id: ID;
  noteType: NoteType;
  date: DateString;

  recordType: NoteRecordType;
  recordId: ID;

  noteItems: ILegacyNoteItem[];
}
