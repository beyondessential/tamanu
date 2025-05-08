import React, { useCallback } from 'react';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteDateTimeField,
  NoteTemplateField,
  NoteTypeField,
  WrittenByField,
} from '../components/NoteCommonFields';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useApi } from '../api';
import { Colors } from '../constants';
import { FormGrid } from '../components';
import { DialogActions, DialogContent } from '@material-ui/core';

export const CreateNoteForm = ({ onSubmit, onCancel, noteTypeCountByType, values, setValues }) => {
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
      <DialogContent
        style={{
          minHeight: '280px',
          overflow: 'hidden',
          maxHeight: '685px',
          paddingBottom: '0px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <FormGrid columns={2}>
          <NoteTypeField
            required
            noteTypeCountByType={noteTypeCountByType}
            onChange={onChangeNoteType}
            size="small"
            fontSize="12px"
          />
          <NoteTemplateField
            noteType={values.noteType}
            onChangeTemplate={onChangeTemplate}
            size="small"
            fontSize="12px"
          />
          <WrittenByField required size="small" fontSize="12px" />
          <NoteDateTimeField required size="small" fontSize="12px" />
        </FormGrid>
        <NoteContentField
          label={<TranslatedText stringId="note.modal.addNote.label" fallback="Add note" />}
          size="small"
        />
      </DialogContent>
      <DialogActions
        color={Colors.white}
        style={{
          padding: '10px 20px',
          background: 'none',
          borderTop: `1px solid ${Colors.softOutline}`,
          position: 'sticky',
          bottom: 0,
        }}
      >
        <FormSubmitCancelRow
          style={{ marginTop: '0' }}
          onConfirm={onSubmit}
          confirmText={<TranslatedText stringId="note.action.addNote" fallback="Add note" />}
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          onCancel={onCancel}
        />
      </DialogActions>
    </>
  );
};
