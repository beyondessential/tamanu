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
          label={<TranslatedText
            stringId="general.type.label"
            fallback="Type"
            data-testid='translatedtext-8nlq' />}
          component={TranslatedSelectField}
          enumValues={PATIENT_ISSUE_LABELS}
          required
          data-testid='field-ae5g' />
        <Field
          name="note"
          label={<TranslatedText
            stringId="general.notes.label"
            fallback="Notes"
            data-testid='translatedtext-s227' />}
          component={TextField}
          multiline
          minRows={2}
          data-testid='field-ecul' />
        <Field
          name="recordedDate"
          label={<TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid='translatedtext-oweh' />}
          component={DateField}
          saveDateAsString
          required
          data-testid='field-zxkq' />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={
            editedObject ? (
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-testid='translatedtext-kpp0' />
            ) : (
              <TranslatedText
                stringId="general.action.add"
                fallback="Add"
                data-testid='translatedtext-kl2u' />
            )
          }
          data-testid='formsubmitcancelrow-67bj' />
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
        .translatedLabel(<TranslatedText
        stringId="general.note.label"
        fallback="Note"
        data-testid='translatedtext-zf8r' />),
      recordedDate: yup
        .date()
        .required()
        .translatedLabel(
          <TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid='translatedtext-oxr3' />,
        ),
    })}
  />
);
