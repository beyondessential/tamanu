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
        noteType={<TranslatedEnum
          value={note.noteType}
          enumValues={NOTE_TYPE_LABELS}
          data-testid='translatedenum-ap5p' />}
        writtenByLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
            data-testid='translatedtext-6z2p' />
        }
        writtenBy={writtenBy}
        dateLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedAt.label"
            fallback="Last updated at date & time"
            data-testid='translatedtext-nvqs' />
        }
        date={note.date}
      />
      <StyledFormGrid columns={2}>
        <WrittenByField
          label={
            <TranslatedText
              stringId="treatmentPlan.note.updatedBy.label"
              fallback="Updated by (or on behalf of)"
              data-testid='translatedtext-u875' />
          }
          required
        />
        <NoteDateTimeField required />
      </StyledFormGrid>
      <NoteContentField
        label={
          <TranslatedText
            stringId="treatmentPlan.note.updateTreatmentPlan.label"
            fallback="Update treatment plan"
            data-testid='translatedtext-8vdy' />
        }
        onChange={onNoteContentChange}
      />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText
          stringId="general.action.save"
          fallback="Save"
          data-testid='translatedtext-0t5n' />}
        cancelText={<TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-testid='translatedtext-a2cv' />}
        onCancel={onCancel}
        data-testid='formsubmitcancelrow-0rfb' />
    </>
  );
};
