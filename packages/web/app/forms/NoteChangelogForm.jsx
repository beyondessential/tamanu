import React from 'react';

import { NOTE_TYPE_LABELS } from '@tamanu/constants';

import { NoteChangeLogs } from '../components/NoteChangeLogs';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { NoteInfoSection, StyledDivider, WrittenByText } from '../components/NoteCommonFields';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
        noteType={NOTE_TYPE_LABELS[note.noteType]}
        date={note.revisedBy?.date || note.date}
        dateLabel={<TranslatedText stringId="note.form.dateTime.label" fallback="Date & time" />}
        writtenByLabel={
          <TranslatedText
            stringId="note.form.writtenBy.label"
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
