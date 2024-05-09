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
        date={note.date}
        dateLabel={<TranslatedText
          stringId="note.lastUpdatedAt.label"
          fallback="Last updated at date & time"
        />}
        writtenByLabel={<TranslatedText
          stringId="note.lastUpdatedBy.label"
          fallback="Last updated by (or on behalf of)"
        />}
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
