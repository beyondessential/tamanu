import React from 'react';
import { FormSubmitCancelRow } from '@tamanu/ui-components';
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
  NoteModalDialogContent,
  NoteModalDialogActions,
  NoteModalFormGrid,
} from '../components/NoteModal/NoteModalCommonComponents';
import { TranslatedText } from '../components';
import { Colors } from '../constants';

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
      <NoteModalDialogContent>
        <DisabledWrapper color={Colors.background}>
          <NoteModalFormGrid columns={2}>
            <NoteTypeField
              noteTypeCountByType={noteTypeCountByType}
              size="small"
              fontSize="12px"
              disabled
            />
            <NoteTemplateField
              noteType={note.noteType}
              onChangeTemplate={onChangeTemplate}
              size="small"
              fontSize="12px"
              disabled
            />
            <PreviouslyWrittenByField
              value={noteOnBehalfOfName}
              size="small"
              fontSize="12px"
              disabled
            />
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
            <NoteDateTimeField required size="small" fontSize="12px" />
          </NoteModalFormGrid>
        </DisabledWrapper>
        <NoteContentField
          label={<TranslatedText stringId="note.modal.addNote.label" fallback="Add note" />}
          size="small"
        />
      </NoteModalDialogContent>
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
