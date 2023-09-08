import React from 'react';

import { ConfirmCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteInfoSection,
  StyledDivider,
  WrittenByText,
} from '../components/NoteCommonFields';
import { NOTE_TYPE_LABELS } from '../constants';

export const EditNoteForm = ({ note, onNoteContentChange, onSubmit, onCancel }) => {
  const noteAuthorName = note.revisedBy
    ? note.revisedBy.author?.displayName
    : note.author?.displayName;
  const noteOnBehalfOfName = note.revisedBy
    ? note.revisedBy.onBehalfOf?.displayName
    : note.onBehalfOf?.displayName;
  const writtenBy = (
    <WrittenByText noteAuthorName={noteAuthorName} noteOnBehalfOfName={noteOnBehalfOfName} />
  );

  return (
    <>
      <NoteInfoSection
        numberOfColumns={3}
        noteType={NOTE_TYPE_LABELS[note.noteType]}
        date={note.revisedBy ? note.revisedBy.date : note.date}
        writtenByLabel="Written by (or on behalf of)"
        writtenBy={writtenBy}
        dateLabel="Date & time"
      />
      <br />
      <NoteContentField onChange={onNoteContentChange} />
      <StyledDivider />
      <ConfirmCancelRow
        onConfirm={onSubmit}
        confirmText="Save"
        cancelText="Cancel"
        onCancel={onCancel}
      />
    </>
  );
};
