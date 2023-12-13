import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import * as yup from 'yup';

import { NOTE_TYPES } from '@tamanu/constants';
import { Form } from '../components/Field';
import { NOTE_FORM_MODES } from '../constants';
import { useAuth } from '../contexts/Auth';
import { foreignKey } from '../utils/validation';
import { CreateNoteForm } from './CreateNoteForm';
import { EditNoteForm } from './EditNoteForm';
import { EditTreatmentPlanNoteForm } from './EditTreatmentPlanNoteForm';
import { NoteChangelogForm } from './NoteChangelogForm';
import { TreatmentPlanNoteChangelogForm } from './TreatmentPlanNoteChangelogForm';

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
      return note.noteType === NOTE_TYPES.TREATMENT_PLAN ?
        <EditTreatmentPlanNoteForm {...props} /> :
        <EditNoteForm {...props} />;
    }

    if (noteFormMode === NOTE_FORM_MODES.VIEW_NOTE) {
      const props = {
        note,
        onCancel,
      };
      return note.noteType === NOTE_TYPES.TREATMENT_PLAN ?
        <TreatmentPlanNoteChangelogForm {...props} /> :
        <NoteChangelogForm {...props} />;
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
        writtenById: foreignKey(
          `${
            noteFormMode === NOTE_FORM_MODES.EDIT_NOTE &&
              note?.noteType === NOTE_TYPES.TREATMENT_PLAN
              ? 'Updated'
              : 'Created'
          } by (or on behalf of) is required`,
        ),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setNoteContent: PropTypes.func.isRequired,
};
