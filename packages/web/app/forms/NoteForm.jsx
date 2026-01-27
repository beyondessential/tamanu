import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { NOTE_TYPES, FORM_TYPES } from '@tamanu/constants';
import { Form, useDateTimeFormat } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { foreignKey } from '../utils/validation';

import { EditTreatmentPlanNoteForm } from './EditTreatmentPlanNoteForm';
import { CreateEditNoteForm } from './CreateEditNoteForm';
import { NOTE_FORM_MODES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const NoteForm = ({
  onCancel,
  note,
  noteTypeCountByType,
  noteFormMode = NOTE_FORM_MODES.CREATE_NOTE,
  onSubmit,
}) => {
  const { currentUser } = useAuth();
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();

  const renderForm = ({ submitForm, values, setValues }) => {
    const isTreatmentPlan = note?.noteTypeId === NOTE_TYPES.TREATMENT_PLAN;

    if (noteFormMode === NOTE_FORM_MODES.EDIT_NOTE && isTreatmentPlan) {
      return (
        <EditTreatmentPlanNoteForm
          note={note}
          onSubmit={submitForm}
          onCancel={onCancel}
          noteTypeCountByType={noteTypeCountByType}
        />
      );
    }

    return (
      <CreateEditNoteForm
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
        date: getCountryCurrentDateTimeString(),
        noteTypeId: note?.noteTypeId,
        writtenById: currentUser.id,
        content: note?.content,
      }}
      formType={
        noteFormMode === NOTE_FORM_MODES.EDIT_NOTE ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM
      }
      validationSchema={yup.object().shape({
        noteTypeId: foreignKey()
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
            note?.noteTypeId === NOTE_TYPES.TREATMENT_PLAN ? (
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
