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
          data-test-id='translatedenum-ap5p' />}
        writtenByLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
            data-test-id='translatedtext-6z2p' />
        }
        writtenBy={writtenBy}
        dateLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedAt.label"
            fallback="Last updated at date & time"
            data-test-id='translatedtext-nvqs' />
        }
        date={note.date}
      />
      <StyledFormGrid columns={2}>
        <WrittenByField
          label={
            <TranslatedText
              stringId="treatmentPlan.note.updatedBy.label"
              fallback="Updated by (or on behalf of)"
              data-test-id='translatedtext-u875' />
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
            data-test-id='translatedtext-8vdy' />
        }
        onChange={onNoteContentChange}
      />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText
          stringId="general.action.save"
          fallback="Save"
          data-test-id='translatedtext-0t5n' />}
        cancelText={<TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-test-id='translatedtext-a2cv' />}
        onCancel={onCancel}
        data-test-id='formsubmitcancelrow-0rfb' />
    </>
  );
};
