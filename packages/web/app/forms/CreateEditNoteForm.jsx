import React, { useCallback } from 'react';

import { FormSubmitCancelRow, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import {
  NoteContentField, NoteDateTimeField, NoteTemplateField, NoteTypeField, WrittenByField, } from '../components/NoteCommonFields';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useApi } from '../api';
import { NOTE_FORM_MODES } from '../constants';
import {
  NoteModalDialogContent,
  NoteModalDialogActions,
  DisabledWrapper,
} from '../components/NoteModal/NoteModalCommonComponents';

export const CreateEditNoteForm = ({
  onSubmit,
  onCancel,
  noteTypeCountByType,
  values,
  setValues,
  noteFormMode,
}) => {
  const api = useApi();
  const disableFields = noteFormMode === NOTE_FORM_MODES.EDIT_NOTE;

  const onChangeNoteType = useCallback(() => {
    setValues(values => ({
      ...values,
      template: null,
    }));
  }, []);

  const onChangeTemplate = useCallback(
    async templateId => {
      if (!templateId) {
        return;
      }
      const template = await api.get(`template/${templateId}`);

      setValues(values => ({
        ...values,
        content: template.body,
      }));
    },
    [api, setValues],
  );

  return (
    <>
      <NoteModalDialogContent>
        <DisabledWrapper color={Colors.background}>
          <FormGrid columns={2} style={{ marginTop: 0 }}>
            <NoteTypeField
              required
              noteTypeCountByType={noteTypeCountByType}
              onChange={onChangeNoteType}
              size="small"
              disabled={disableFields}
            />
            <NoteTemplateField
              noteType={values.noteType}
              onChangeTemplate={onChangeTemplate}
              size="small"
              disabled={disableFields}
            />
            <WrittenByField required size="small" disabled={disableFields} />
            <NoteDateTimeField required size="small" disabled={disableFields} />
          </FormGrid>
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
            noteFormMode === NOTE_FORM_MODES.EDIT_NOTE ? (
              <TranslatedText stringId="note.action.saveChanges" fallback="Save changes" />
            ) : (
              <TranslatedText stringId="note.action.addNote" fallback="Add note" />
            )
          }
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          onCancel={onCancel}
        />
      </NoteModalDialogActions>
    </>
  );
};
