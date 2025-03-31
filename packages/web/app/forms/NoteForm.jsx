import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { NOTE_TYPES } from '@tamanu/constants';
import { useAuth } from '../contexts/Auth';
import { foreignKey } from '../utils/validation';
import { Form } from '../components/Field';
import { EditTreatmentPlanNoteForm } from './EditTreatmentPlanNoteForm';
import { EditNoteForm } from './EditNoteForm';
import { NoteChangelogForm } from './NoteChangelogForm';
import { CreateNoteForm } from './CreateNoteForm';
import { TreatmentPlanNoteChangelogForm } from './TreatmentPlanNoteChangelogForm';
import { FORM_TYPES, NOTE_FORM_MODES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const NoteForm = ({
  onCancel,
  note,
  noteTypeCountByType,
  noteFormMode = NOTE_FORM_MODES.CREATE_NOTE,
  onSubmit,
  setNoteContent,
}) => {
  const { currentUser } = useAuth();

  const handleNoteContentChange = useCallback(e => setNoteContent(e.target.value), [
    setNoteContent,
  ]);

  const renderForm = ({ submitForm, values, setValues }) => {
    if (noteFormMode === NOTE_FORM_MODES.EDIT_NOTE) {
      const props = {
        note,
        onNoteContentChange: handleNoteContentChange,
        onSubmit: submitForm,
        onCancel,
      };
      return note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
        <EditTreatmentPlanNoteForm {...props} />
      ) : (
        <EditNoteForm {...props} />
      );
    }

    if (noteFormMode === NOTE_FORM_MODES.VIEW_NOTE) {
      const props = {
        note,
        onCancel,
      };
      return note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
        <TreatmentPlanNoteChangelogForm {...props} />
      ) : (
        <NoteChangelogForm {...props} />
      );
    }

    return (
      <CreateNoteForm
        note={note}
        onNoteContentChange={handleNoteContentChange}
        onSubmit={submitForm}
        onCancel={onCancel}
        noteTypeCountByType={noteTypeCountByType}
        values={values}
        setValues={setValues}
      />
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      showInlineErrorsOnly
      initialValues={{
        date: getCurrentDateTimeString(),
        noteType: note?.noteType,
        writtenById: currentUser.id,
        content: note?.content,
      }}
      formType={
        noteFormMode === NOTE_FORM_MODES.EDIT_NOTE ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM
      }
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf(Object.values(NOTE_TYPES))
          .required()
          .translatedLabel(<TranslatedText
          stringId="note.noteType.label"
          fallback="Note type"
          data-testid='translatedtext-6b7b' />),
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid='translatedtext-4vjk' />),
        content: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="note.validation.content.path"
              fallback="Content"
              data-testid='translatedtext-bkb7' />,
          ),
        writtenById: foreignKey().translatedLabel(
          noteFormMode === NOTE_FORM_MODES.EDIT_NOTE &&
            note?.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
            <TranslatedText
              stringId="validation.rule.updatedByOnBehalfOf"
              fallback="Updated by (or on behalf of)"
              data-testid='translatedtext-15n8' />
          ) : (
            <TranslatedText
              stringId="validation.rule.createdByOnBehalfOf"
              fallback="Created by (or on behalf of)"
              data-testid='translatedtext-7cgt' />
          ),
        ),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setNoteContent: PropTypes.func.isRequired,
};
