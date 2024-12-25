import { NOTE_TYPES } from '@tamanu/constants';
import type { ValueOf } from 'type-fest';

export const getNoteWithType = <T extends { noteType: string }>(notes: T[], noteType: ValueOf<typeof NOTE_TYPES> ) => {
  return getNotesWithType(notes, noteType)[0];
};

export const getNotesWithType = <T extends { noteType: string }>(notes: T[], noteType: ValueOf<typeof NOTE_TYPES> ) => {
  return notes.filter(note => note.noteType === noteType);
};
