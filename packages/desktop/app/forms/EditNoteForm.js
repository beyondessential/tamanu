import React from 'react';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteInfoSection,
  StyledDivider,
  WrittenByText,
} from '../components/NoteCommonFields';
import { NOTE_TYPE_LABELS } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
        writtenByLabel=<TranslatedText
          stringId="note.form.writtenBy.label"
          fallback="Written by (or on behalf of)"
        />
        writtenBy={writtenBy}
        dateLabel=<TranslatedText stringId="note.form.dateTime.label" fallback="Date & time" />
      />
      <br />
      <NoteContentField onChange={onNoteContentChange} />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText=<TranslatedText stringId="general.action.save" fallback="Save" />
        cancelText=<TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        onCancel={onCancel}
      />
    </>
  );
};
