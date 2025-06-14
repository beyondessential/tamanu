import React from 'react';

import { BaseModal } from './BaseModal';
import { NoteInfoSection, StyledDivider, WrittenByText } from './NoteCommonFields';
import { TranslatedEnum, TranslatedText } from './Translation';
import { NoteChangeLogs } from './NoteChangeLogs';
import { ConfirmCancelRow } from './ButtonRow';
import { NOTE_TYPE_LABELS, NOTE_TYPES } from '@tamanu/constants';

const getChangelogContext = note => {
  const isTreatmentPlan = note.noteType === NOTE_TYPES.TREATMENT_PLAN;

  return {
    date: isTreatmentPlan ? note.date : note.revisedBy?.date || note.date,
    dateLabel: isTreatmentPlan ? (
      <TranslatedText stringId="note.lastUpdatedAt.label" fallback="Last updated at date & time" />
    ) : (
      <TranslatedText stringId="note.dateTime.label" fallback="Date & time" />
    ),
    authorName: isTreatmentPlan
      ? note.author?.displayName
      : note.revisedBy?.author?.displayName || note.author?.displayName,
    onBehalfName: isTreatmentPlan
      ? note.onBehalfOf?.displayName
      : note.revisedBy?.onBehalfOf?.displayName || note.onBehalfOf?.displayName,
    writtenByLabel: isTreatmentPlan ? (
      <TranslatedText
        stringId="note.lastUpdatedBy.label"
        fallback="Last updated by (or on behalf of)"
      />
    ) : (
      <TranslatedText stringId="note.writtenBy.label" fallback="Written by (or on behalf of)" />
    ),
  };
};

const NoteChangelogContent = ({ note, onCancel }) => {
  const { date, dateLabel, authorName, onBehalfName, writtenByLabel } = getChangelogContext(note);

  const writtenBy = <WrittenByText noteAuthorName={authorName} noteOnBehalfOfName={onBehalfName} />;

  return (
    <>
      <NoteInfoSection
        numberOfColumns={3}
        noteType={<TranslatedEnum value={note.noteType} enumValues={NOTE_TYPE_LABELS} />}
        date={date}
        dateLabel={dateLabel}
        writtenByLabel={writtenByLabel}
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
      <NoteChangelogContent note={note} onCancel={onCancel} />
    </BaseModal>
  );
};
