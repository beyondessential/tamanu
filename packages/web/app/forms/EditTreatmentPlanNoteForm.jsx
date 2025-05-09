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
    <WrittenByText
      noteAuthorName={noteAuthorName}
      noteOnBehalfOfName={noteOnBehalfOfName}
      data-testid="writtenbytext-wai3"
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
            data-testid="translatedenum-snuo"
          />
        }
        writtenByLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedBy.label"
            fallback="Last updated by (or on behalf of)"
            data-testid="translatedtext-jqpd"
          />
        }
        writtenBy={writtenBy}
        dateLabel={
          <TranslatedText
            stringId="treatmentPlan.note.form.lastUpdatedAt.label"
            fallback="Last updated at date & time"
            data-testid="translatedtext-zmar"
          />
        }
        date={note.date}
        data-testid="noteinfosection-nmfe"
      />
      <StyledFormGrid columns={2} data-testid="styledformgrid-oql9">
        <WrittenByField
          label={
            <TranslatedText
              stringId="treatmentPlan.note.updatedBy.label"
              fallback="Updated by (or on behalf of)"
              data-testid="translatedtext-yo5s"
            />
          }
          required
          data-testid="writtenbyfield-upih"
        />
        <NoteDateTimeField required data-testid="notedatetimefield-d8u4" />
      </StyledFormGrid>
      <NoteContentField
        label={
          <TranslatedText
            stringId="treatmentPlan.note.updateTreatmentPlan.label"
            fallback="Update treatment plan"
            data-testid="translatedtext-ufcp"
          />
        }
        onChange={onNoteContentChange}
        data-testid="notecontentfield-5qmt"
      />
      <StyledDivider data-testid="styleddivider-g23p" />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={
          <TranslatedText
            stringId="general.action.save"
            fallback="Save"
            data-testid="translatedtext-n1yq"
          />
        }
        cancelText={
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-a20x"
          />
        }
        onCancel={onCancel}
        data-testid="formsubmitcancelrow-5z29"
      />
    </>
  );
};
