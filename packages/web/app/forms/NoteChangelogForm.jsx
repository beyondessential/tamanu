import React from 'react';

import { NOTE_TYPE_LABELS } from '@tamanu/constants';

import { NoteChangeLogs } from '../components/NoteChangeLogs';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { NoteInfoSection, StyledDivider, WrittenByText } from '../components/NoteCommonFields';
import { TranslatedEnum, TranslatedText } from '../components/Translation';

export const NoteChangelogForm = ({ note, onCancel }) => {
  const createdByAuthorName = note.revisedBy
    ? note.revisedBy.author?.displayName
    : note.author?.displayName;
  const createdByOnBehalfOfName = note.revisedBy
    ? note.revisedBy.onBehalfOf?.displayName
    : note.onBehalfOf?.displayName;

  const writtenBy = (
    <WrittenByText
      noteAuthorName={createdByAuthorName}
      noteOnBehalfOfName={createdByOnBehalfOfName}
    />
  );

  return (
    <>
      <NoteInfoSection
        numberOfColumns={3}
        noteType={<TranslatedEnum
          value={note.noteType}
          enumValues={NOTE_TYPE_LABELS}
          data-test-id='translatedenum-j0xm' />}
        date={note.revisedBy?.date || note.date}
        dateLabel={<TranslatedText
          stringId="note.dateTime.label"
          fallback="Date & time"
          data-test-id='translatedtext-phe4' />}
        writtenByLabel={
          <TranslatedText
            stringId="note.writtenBy.label"
            fallback="Written by (or on behalf of)"
            data-test-id='translatedtext-4b6g' />
        }
        writtenBy={writtenBy}
      />
      <br />
      <NoteChangeLogs note={note} />
      <StyledDivider />
      <ConfirmCancelRow
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-test-id='translatedtext-ugx5' />}
        onConfirm={onCancel}
      />
    </>
  );
};
