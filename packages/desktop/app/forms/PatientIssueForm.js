import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { PATIENT_ISSUE_TYPES } from '@tamanu/constants';
import { Form, Field, DateField, SelectField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { TranslatedText } from '../components/Translation/TranslatedText';

const ISSUE_TYPES = [
  { value: PATIENT_ISSUE_TYPES.ISSUE, label: 'Issue' },
  { value: PATIENT_ISSUE_TYPES.WARNING, label: 'Warning' },
];

export const PatientIssueForm = ({ onSubmit, editedObject, onCancel }) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="type"
          label={<TranslatedText stringId="form.general.type.label" fallback="Type" />}
          component={SelectField}
          options={ISSUE_TYPES}
          required
        />
        <Field
          name="note"
          label={<TranslatedText stringId="form.general.notes.label" fallback="Notes" />}
          component={TextField}
          multiline
          rows={2}
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText stringId="form.general.recordedDate.label" fallback="Date recorded" />
          }
          component={DateField}
          saveDateAsString
          required
        />
        <ConfirmCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={
            editedObject ? (
              <TranslatedText stringId="general.actions.save" fallback="Save" />
            ) : (
              <TranslatedText stringId="general.actions.add" fallback="Add" />
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
    validationSchema={yup.object().shape({
      note: yup.string().required(),
      recordedDate: yup.date().required(),
    })}
  />
);
