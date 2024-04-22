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
        noteType={
          <TranslatedEnum
            prefix="note.property.type"
            value={note.noteType}
            enumValues={NOTE_TYPE_LABELS}
          />
        }
        date={note.revisedBy?.date || note.date}
        dateLabel={<TranslatedText stringId="note.dateTime.label" fallback="Date & time" />}
        writtenByLabel={
          <TranslatedText
            stringId="note.writtenBy.label"
            fallback="Written by (or on behalf of)"
          />
        }
        writtenBy={writtenBy}
      />
      <br />
      <NoteChangeLogs note={note} />
      <StyledDivider />
      <ConfirmCancelRow
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        onConfirm={onCancel}
      />
    </>
  );
};
