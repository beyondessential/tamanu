import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { PATIENT_ISSUE_TYPES } from '@tamanu/constants';
import { Form, Field, DateField, SelectField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

const ISSUE_TYPES = [
  { value: PATIENT_ISSUE_TYPES.ISSUE, label: 'Issue' },
  { value: PATIENT_ISSUE_TYPES.WARNING, label: 'Warning' },
];

export const PatientIssueForm = ({ onSubmit, editedObject, onCancel }) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field name="type" label="Type" component={SelectField} options={ISSUE_TYPES} required />
        <Field name="note" label="Notes" component={TextField} multiline rows={2} />
        <Field
          name="recordedDate"
          label="Date recorded"
          component={DateField}
          saveDateAsString
          required
        />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={editedObject ? 'Save' : 'Add'}
        />
      </FormGrid>
    )}
    initialValues={{
      recordedDate: getCurrentDateTimeString(),
      type: 'issue',
      ...editedObject,
    }}
    validationSchema={yup.object().shape({
      note: yup.string().required(),
      recordedDate: yup.date().required(),
    })}
  />
);
