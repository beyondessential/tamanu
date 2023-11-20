import React from 'react';

import { NoteChangeLogs } from '../components/NoteChangeLogs';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { NoteInfoSection, StyledDivider, WrittenByText } from '../components/NoteCommonFields';
import { NOTE_TYPE_LABELS } from '../constants';

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
        noteType={NOTE_TYPE_LABELS[note.noteType]}
        date={note.date}
        dateLabel="Last updated at date & time"
        writtenByLabel="Last updated by (or on behalf of)"
        writtenBy={writtenBy}
      />
      <br />
      <NoteChangeLogs note={note} />
      <StyledDivider />
      <ConfirmCancelRow confirmText="Close" onConfirm={onCancel} />
    </>
  );
};
