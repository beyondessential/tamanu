import { ID } from './ID';
import { INoteItem } from './INoteItem';
// import { IReferenceData } from './IReferenceData';
import { DateString } from './DateString';

export interface INoteItem {
  id: ID;
  date: DateString,
  
  revisedById: NoteType,
  
  // Can't link to record
  recordType: NoteRecordType,
  recordId: ID,

  noteItems: INoteItem[],
}

export interface IDataRequiredToCreateNoteItem {
  id?: ID;
  noteType: NoteType,
  date?: DateString,

  // Can't link to record
  recordType: NoteRecordType,
  recordId: ID,

  // noteItems: INoteItem[],
}
