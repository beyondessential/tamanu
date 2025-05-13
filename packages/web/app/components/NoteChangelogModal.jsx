import React from 'react';

import { BaseModal } from './BaseModal';
import { NoteInfoSection, StyledDivider, WrittenByText } from './NoteCommonFields';
import { TranslatedEnum, TranslatedText } from './Translation';
import { NoteChangeLogs } from './NoteChangeLogs';
import { ConfirmCancelRow } from './ButtonRow';
import { NOTE_TYPE_LABELS, NOTE_TYPES } from '@tamanu/constants';

const NoteChangelogContent = ({ note, onCancel }) => {
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
        noteType={<TranslatedEnum value={note.noteType} enumValues={NOTE_TYPE_LABELS} />}
        date={note.revisedBy?.date || note.date}
        dateLabel={<TranslatedText stringId="note.dateTime.label" fallback="Date & time" />}
        writtenByLabel={
          <TranslatedText stringId="note.writtenBy.label" fallback="Written by (or on behalf of)" />
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

const TreatmentPlanNoteChangelogContent = ({ note, onCancel }) => {
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
        noteType={<TranslatedEnum value={note.noteType} enumValues={NOTE_TYPE_LABELS} />}
        date={note.date}
        dateLabel={
          <TranslatedText
            stringId="note.lastUpdatedAt.label"
            fallback="Last updated at date & time"
          />
        }
        writtenByLabel={
          <TranslatedText
            stringId="note.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
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

export const NoteChangelogModal = ({ open, note, onCancel }) => {
  if (!note) {
    return null;
  }

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      title={<TranslatedText stringId="note.modal.changeLog.title" fallback="Change Log" />}
      width="md"
    >
      {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
        <TreatmentPlanNoteChangelogContent note={note} onCancel={onCancel} />
      ) : (
        <NoteChangelogContent note={note} onCancel={onCancel} />
      )}
    </BaseModal>
  );
};
