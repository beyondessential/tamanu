import React from 'react';

import { NOTE_TYPE_LABELS } from '@tamanu/constants';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteInfoSection,
  StyledDivider,
  WrittenByText,
} from '../components/NoteCommonFields';
import { TranslatedText, TranslatedEnum } from '../components/Translation';

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
        noteType={
          <TranslatedEnum
            prefix="note.property.type"
            value={note.noteType}
            enumValues={NOTE_TYPE_LABELS}
          />
        }
        date={note.revisedBy ? note.revisedBy.date : note.date}
        writtenByLabel={<TranslatedText
          stringId="note.writtenBy.label"
          fallback="Written by (or on behalf of)"
        />}
        writtenBy={writtenBy}
        dateLabel={<TranslatedText stringId="note.dateTime.label" fallback="Date & time" />}
      />
      <br />
      <NoteContentField onChange={onNoteContentChange} />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        onCancel={onCancel}
      />
    </>
  );
};
