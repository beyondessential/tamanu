import React from 'react';
import styled from 'styled-components';
import { FormSubmitCancelRow } from '../components/ButtonRow';
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
import { Colors } from '../constants';

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
              size="small"
              customStyleObject={{
                control: provided => ({ ...provided, fontSize: '14px' }),
                option: provided => ({ ...provided, fontSize: '14px' }),
              }}
              disabled
            />
            <NoteTemplateField
              noteType={note.noteType}
              onChangeTemplate={onChangeTemplate}
              size="small"
              disabled
            />
            <PreviouslyWrittenByField value={noteOnBehalfOfName} size="small" disabled />
            <PreviousDateTimeField value={note.createdAt} size="small" />
            <WrittenByField
              label={
                <TranslatedText
                  stringId="treatmentPlan.note.updatedBy.label"
                  fallback="Updated by (or on behalf of)"
                />
              }
              required
              size="small"
            />
            <NoteDateTimeField required size="small" />
          </NoteModalFormGrid>
        </DisabledWrapper>
        <NoteContentField
          label={<TranslatedText stringId="note.modal.addNote.label" fallback="Add note" />}
          size="small"
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
