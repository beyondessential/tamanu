import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { PATIENT_ISSUE_TYPES, PATIENT_ISSUE_LABELS } from '@tamanu/constants';
import { DateField, Field, Form, TextField, TranslatedSelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FORM_TYPES } from '../constants';

export const PatientIssueForm = ({ onSubmit, editedObject, onCancel }) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="type"
          label={<TranslatedText stringId="general.type.label" fallback="Type" />}
          component={TranslatedSelectField}
          enumValues={PATIENT_ISSUE_LABELS}
          required
        />
        <Field
          name="note"
          label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
          component={TextField}
          multiline
          minRows={2}
        />
        <Field
          name="recordedDate"
          label={<TranslatedText stringId="general.recordedDate.label" fallback="Date recorded" />}
          component={DateField}
          saveDateAsString
          required
        />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={
            editedObject ? (
              <TranslatedText stringId="general.action.save" fallback="Save" />
            ) : (
              <TranslatedText stringId="general.action.add" fallback="Add" />
            )
          }
        />
      </FormGrid>
    )}
    initialValues={{
      recordedDate: getCurrentDateTimeString(),
      type: PATIENT_ISSUE_TYPES.ISSUE,
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      note: yup
        .string()
        .required()
        .translatedLabel(<TranslatedText stringId="general.note.label" fallback="Note" />),
      recordedDate: yup
        .date()
        .required()
        .translatedLabel(
          <TranslatedText stringId="general.recordedDate.label" fallback="Date recorded" />,
        ),
    })}
  />
);
