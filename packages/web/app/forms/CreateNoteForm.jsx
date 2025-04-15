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
    setValues((values) => ({
      ...values,
      template: null,
    }));
  }, []);

  const onChangeTemplate = useCallback(
    async (templateId) => {
      if (!templateId) {
        return;
      }
      const template = await api.get(`template/${templateId}`);

      setValues((values) => ({
        ...values,
        content: template.body,
      }));
    },
    [api, setValues],
  );

  return (
    <>
      <StyledFormGrid columns={4} data-testid="styledformgrid-zicy">
        <NoteTypeField
          required
          noteTypeCountByType={noteTypeCountByType}
          onChange={onChangeNoteType}
          data-testid="notetypefield-tx5s"
        />
        <NoteTemplateField
          noteType={values.noteType}
          onChangeTemplate={onChangeTemplate}
          data-testid="notetemplatefield-jvkn"
        />
        <WrittenByField required data-testid="writtenbyfield-6za7" />
        <NoteDateTimeField required data-testid="notedatetimefield-5v7c" />
      </StyledFormGrid>
      <NoteContentField
        label={
          <TranslatedText
            stringId="note.modal.addNote.label"
            fallback="Add note"
            data-testid="translatedtext-dyln"
          />
        }
        onChange={onNoteContentChange}
        data-testid="notecontentfield-hjsv"
      />
      <StyledDivider data-testid="styleddivider-zyya" />
      <FormSubmitCancelRow
        onConfirm={onSubmit}
        confirmText={
          <TranslatedText
            stringId="note.action.addNote"
            fallback="Add note"
            data-testid="translatedtext-n2dw"
          />
        }
        cancelText={
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-nrsx"
          />
        }
        onCancel={onCancel}
        data-testid="formsubmitcancelrow-6cnr"
      />
    </>
  );
};
