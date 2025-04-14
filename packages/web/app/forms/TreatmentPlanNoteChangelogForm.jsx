import React from 'react';

import { NOTE_TYPE_LABELS } from '@tamanu/constants';

import { NoteChangeLogs } from '../components/NoteChangeLogs';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { NoteInfoSection, StyledDivider, WrittenByText } from '../components/NoteCommonFields';
import { TranslatedText, TranslatedEnum } from '../components/Translation';

export const TreatmentPlanNoteChangelogForm = ({ note, onCancel }) => {
  const updatedByAuthorName = note.author?.displayName;
  const updatedByOnBehalfOfName = note.onBehalfOf?.displayName;

  const writtenBy = (
    <WrittenByText
      noteAuthorName={updatedByAuthorName}
      noteOnBehalfOfName={updatedByOnBehalfOfName}
      data-testid="writtenbytext-8x1d"
    />
  );

  return (
    <>
      <NoteInfoSection
        numberOfColumns={3}
        noteType={
          <TranslatedEnum
            value={note.noteType}
            enumValues={NOTE_TYPE_LABELS}
            data-testid="translatedenum-xmcq"
          />
        }
        date={note.date}
        dateLabel={
          <TranslatedText
            stringId="note.lastUpdatedAt.label"
            fallback="Last updated at date & time"
            data-testid="translatedtext-gf64"
          />
        }
        writtenByLabel={
          <TranslatedText
            stringId="note.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
            data-testid="translatedtext-6lf3"
          />
        }
        writtenBy={writtenBy}
        data-testid="noteinfosection-r8z5"
      />
      <br />
      <NoteChangeLogs note={note} data-testid="notechangelogs-zut8" />
      <StyledDivider data-testid="styleddivider-w141" />
      <ConfirmCancelRow
        confirmText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-gigm"
          />
        }
        onConfirm={onCancel}
        data-testid="confirmcancelrow-i0jq"
      />
    </>
  );
};
