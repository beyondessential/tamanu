import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { NOTE_TYPES } from '@tamanu/constants';
import { useAuth } from '../contexts/Auth';
import { foreignKey } from '../utils/validation';
import { Form } from '../components/Field';
import { EditTreatmentPlanNoteForm } from './EditTreatmentPlanNoteForm';
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
}) => {
  const { currentUser } = useAuth();

  const renderForm = ({ submitForm, values, setValues }) => {
    if (noteFormMode === NOTE_FORM_MODES.EDIT_NOTE) {
      const props = {
        note,
        onSubmit: submitForm,
        onCancel,
      };
      return note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
        <EditTreatmentPlanNoteForm
          {...props}
          noteTypeCountByType={noteTypeCountByType}
          onChangeTemplate={() => {}}
        />
      ) : (
        <CreateNoteForm
          {...props}
          values={values}
          setValues={setValues}
          noteFormMode={noteFormMode}
        />
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
        onSubmit={submitForm}
        onCancel={onCancel}
        noteTypeCountByType={noteTypeCountByType}
        values={values}
        noteFormMode={noteFormMode}
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
          .translatedLabel(<TranslatedText stringId="note.noteType.label" fallback="Note type" />),
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
        content: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="note.validation.content.path" fallback="Content" />,
          ),
        writtenById: foreignKey().translatedLabel(
          noteFormMode === NOTE_FORM_MODES.EDIT_NOTE &&
            note?.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
            <TranslatedText
              stringId="validation.rule.updatedByOnBehalfOf"
              fallback="Updated by (or on behalf of)"
            />
          ) : (
            <TranslatedText
              stringId="validation.rule.createdByOnBehalfOf"
              fallback="Created by (or on behalf of)"
            />
          ),
        ),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
