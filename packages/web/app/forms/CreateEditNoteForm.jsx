import React, { useCallback } from 'react';
import styled from 'styled-components';

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

const StyledNoteModalDialogContent = styled(NoteModalDialogContent)`
  .MuiInputBase-input {
    font-size: 14px;
  }
`;

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
      <StyledNoteModalDialogContent>
        <DisabledWrapper color={Colors.background}>
          <FormGrid columns={2} style={{ marginTop: 0 }}>
            <NoteTypeField
              required
              noteTypeCountByType={noteTypeCountByType}
              onChange={onChangeNoteType}
              disabled={disableFields}
              $fontSize="14px"
            />
            <NoteTemplateField
              noteType={values.noteType}
              onChangeTemplate={onChangeTemplate}
              disabled={disableFields}
            />
            <WrittenByField required disabled={disableFields} />
            <NoteDateTimeField required disabled={disableFields} />
          </FormGrid>
        </DisabledWrapper>
        <NoteContentField
          label={<TranslatedText stringId="note.modal.addNote.label" fallback="Add note" />}
        />
      </StyledNoteModalDialogContent>
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
