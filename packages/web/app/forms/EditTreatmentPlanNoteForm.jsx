import React from 'react';
import { FormSubmitCancelRow } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import styled from 'styled-components';
import {
  NoteContentField,
  NoteDateTimeField,
  NoteTemplateField,
  NoteTypeField,
  WrittenByField,
  PreviouslyWrittenByField,
  PreviousDateTimeField,
} from '../components/NoteCommonFields';
import {
  DisabledWrapper,
  NoteModalDialogActions,
  NoteModalFormGrid,
  NoteModalDialogContent,
} from '../components/NoteModal/NoteModalCommonComponents';
import { TranslatedText } from '../components';

const StyledNoteModalDialogContent = styled(NoteModalDialogContent)`
  .MuiInputBase-input {
    font-size: 14px;
  }
`;

export const EditTreatmentPlanNoteForm = ({
  note,
  onSubmit,
  onCancel,
  noteTypeCountByType,
  onChangeTemplate,
}) => {
  const noteOnBehalfOfName = note.onBehalfOf?.displayName;

  return (
    <>
      <StyledNoteModalDialogContent>
        <DisabledWrapper color={Colors.background}>
          <NoteModalFormGrid columns={2}>
            <NoteTypeField
              noteTypeCountByType={noteTypeCountByType}
              $fontSize="14px"
              disabled
            />
            <NoteTemplateField
              noteType={note.noteType}
              onChangeTemplate={onChangeTemplate}
              disabled
            />
            <PreviouslyWrittenByField value={noteOnBehalfOfName} disabled />
            <PreviousDateTimeField value={note.createdAt} />
            <WrittenByField
              label={
                <TranslatedText
                  stringId="treatmentPlan.note.updatedBy.label"
                  fallback="Updated by (or on behalf of)"
                />
              }
              required
            />
            <NoteDateTimeField required />
          </NoteModalFormGrid>
        </DisabledWrapper>
        <NoteContentField
          label={<TranslatedText stringId="note.modal.addNote.label" fallback="Add note" />}
          isEditMode
          isTreatmentPlanNote
        />
      </StyledNoteModalDialogContent>
      <NoteModalDialogActions>
        <FormSubmitCancelRow
          style={{ marginTop: '0' }}
          onConfirm={onSubmit}
          confirmText={
            <TranslatedText stringId="note.action.saveChanges" fallback="Save changes" />
          }
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          onCancel={onCancel}
        />
      </NoteModalDialogActions>
    </>
  );
};
