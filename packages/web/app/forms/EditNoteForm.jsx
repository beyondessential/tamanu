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
        noteType={<TranslatedEnum
          value={note.noteType}
          enumValues={NOTE_TYPE_LABELS}
          data-testid='translatedenum-dua1' />}
        date={note.revisedBy ? note.revisedBy.date : note.date}
        writtenByLabel={
          <TranslatedText
            stringId="note.writtenBy.label"
            fallback="Written by (or on behalf of)"
            data-testid='translatedtext-3s0b' />
        }
        writtenBy={writtenBy}
        dateLabel={<TranslatedText
          stringId="note.dateTime.label"
          fallback="Date & time"
          data-testid='translatedtext-c8be' />}
      />
      <br />
      <NoteContentField onChange={onNoteContentChange} />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText
          stringId="general.action.save"
          fallback="Save"
          data-testid='translatedtext-ps84' />}
        cancelText={<TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-testid='translatedtext-g65y' />}
        onCancel={onCancel}
        data-testid='formsubmitcancelrow-hjhr' />
    </>
  );
};
