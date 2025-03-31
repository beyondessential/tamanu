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
      data-testid='writtenbytext-h3bz' />
  );

  return (
    <>
      <NoteInfoSection
        numberOfColumns={3}
        noteType={<TranslatedEnum
          value={note.noteType}
          enumValues={NOTE_TYPE_LABELS}
          data-testid='translatedenum-jp2c' />}
        date={note.revisedBy?.date || note.date}
        dateLabel={<TranslatedText
          stringId="note.dateTime.label"
          fallback="Date & time"
          data-testid='translatedtext-oxfk' />}
        writtenByLabel={
          <TranslatedText
            stringId="note.writtenBy.label"
            fallback="Written by (or on behalf of)"
            data-testid='translatedtext-opy6' />
        }
        writtenBy={writtenBy}
        data-testid='noteinfosection-ijyf' />
      <br />
      <NoteChangeLogs note={note} data-testid='notechangelogs-dqo4' />
      <StyledDivider data-testid='styleddivider-5vl0' />
      <ConfirmCancelRow
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-testid='translatedtext-a0v8' />}
        onConfirm={onCancel}
        data-testid='confirmcancelrow-c5u5' />
    </>
  );
};
