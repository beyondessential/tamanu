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
import { NOTE_FORM_MODES } from '../constants';

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
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf(Object.values(NOTE_TYPES))
          .required('Note type is required'),
        date: yup.date().required('Date is required'),
        content: yup.string().required('Content is required'),
        writtenById: foreignKey('Written by (or on behalf of) is required'),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setNoteContent: PropTypes.func.isRequired,
};
