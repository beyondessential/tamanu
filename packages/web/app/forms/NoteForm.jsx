import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

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
import { useTranslation } from '../contexts/Translation';
import { TranslatedString } from '../../../shared/src/models';

export const NoteForm = ({
  onCancel,
  note,
  noteTypeCountByType,
  noteFormMode = NOTE_FORM_MODES.CREATE_NOTE,
  onSubmit,
  setNoteContent,
}) => {
  const { currentUser } = useAuth();
  const { getTranslation } = useTranslation();

  const handleNoteContentChange = useCallback(e => setNoteContent(e.target.value), [
    setNoteContent,
  ]);

  const renderForm = ({ submitForm }) => {
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
          .translatedLabel(
            <TranslatedString stringId="note.noteType.label" fallback="Note type" />,
          ),
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedString stringId="general.date.label" fallback="Date" />),
        content: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedString stringId="note.validation.content.path" fallback="Content" />,
          ),
        writtenById: foreignKey(
          noteFormMode === NOTE_FORM_MODES.EDIT_NOTE && note?.noteType === NOTE_TYPES.TREATMENT_PLAN
            ? getTranslation(
                'validation.rule.updatedByOnBehalfOfRequired',
                'Updated by (or on behalf of) is required',
              )
            : getTranslation(
                'validation.rule.createdByOnBehalfOfRequired',
                'Created by (or on behalf of) is required',
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
