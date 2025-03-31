import React, { useCallback } from 'react';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteDateTimeField,
  NoteTemplateField,
  NoteTypeField,
  StyledDivider,
  StyledFormGrid,
  WrittenByField,
} from '../components/NoteCommonFields';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useApi } from '../api';

export const CreateNoteForm = ({
  onNoteContentChange,
  onSubmit,
  onCancel,
  noteTypeCountByType,
  values,
  setValues,
}) => {
  const api = useApi();

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
      <StyledFormGrid columns={4}>
        <NoteTypeField
          required
          noteTypeCountByType={noteTypeCountByType}
          onChange={onChangeNoteType}
        />
        <NoteTemplateField noteType={values.noteType} onChangeTemplate={onChangeTemplate} />
        <WrittenByField required />
        <NoteDateTimeField required />
      </StyledFormGrid>
      <NoteContentField
        label={<TranslatedText
          stringId="note.modal.addNote.label"
          fallback="Add note"
          data-test-id='translatedtext-x73v' />}
        onChange={onNoteContentChange}
      />
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={<TranslatedText
          stringId="note.action.addNote"
          fallback="Add note"
          data-test-id='translatedtext-9wof' />}
        cancelText={<TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-test-id='translatedtext-gbv7' />}
        onCancel={onCancel}
        data-test-id='formsubmitcancelrow-lk27' />
    </>
  );
};
