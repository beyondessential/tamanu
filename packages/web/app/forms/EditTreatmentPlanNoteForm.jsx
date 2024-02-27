import React from 'react';
import styled from 'styled-components';

import { NOTE_TYPE_LABELS } from '@tamanu/constants';

import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteDateTimeField,
  NoteInfoSection,
  StyledDivider,
  WrittenByField,
  WrittenByText,
} from '../components/NoteCommonFields';
import { TranslatedEnum, TranslatedText } from '../components/Translation';

const StyledFormGrid = styled(FormGrid)`
  width: 700px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

export const EditTreatmentPlanNoteForm = ({ note, onNoteContentChange, onSubmit, onCancel }) => {
  const noteAuthorName = note.author?.displayName;
  const noteOnBehalfOfName = note.onBehalfOf?.displayName;
  const writtenBy = (
    <WrittenByText noteAuthorName={noteAuthorName} noteOnBehalfOfName={noteOnBehalfOfName} />
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
        writtenByLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
          />
        }
        writtenBy={writtenBy}
        dateLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedAt.label"
            fallback="Last updated at date & time"
          />
        }
        date={note.date}
      />
      <StyledFormGrid columns={2}>
        <WrittenByField
          label={<TranslatedText
            stringId="treatmentPlan.note.updatedBy.label"
            fallback="Updated by (or on behalf of)"
          />}
          required
        />
        <NoteDateTimeField required />
      </StyledFormGrid>

      <NoteContentField
        label={<TranslatedText
          stringId="treatmentPlan.note.updateTreatmentPlan.label"
          fallback="Update treatment plan"
        />}
        onChange={onNoteContentChange}
      />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        onCancel={onCancel}
      />
    </>
  );
};
