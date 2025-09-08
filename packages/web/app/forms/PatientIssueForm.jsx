import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { PATIENT_ISSUE_TYPES, PATIENT_ISSUE_LABELS } from '@tamanu/constants';
import { TextField } from '@tamanu/ui-components';
import { DateField, Field, Form, TranslatedSelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FORM_TYPES } from '../constants';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';

export const PatientIssueForm = ({ onSubmit, editedObject, onCancel }) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1} data-testid="formgrid-vv7x">
        <NoteModalActionBlocker>
          <Field
            name="type"
            label={
              <TranslatedText
                stringId="general.type.label"
                fallback="Type"
                data-testid="translatedtext-wu6v"
              />
            }
            component={TranslatedSelectField}
            enumValues={PATIENT_ISSUE_LABELS}
            required
            data-testid="field-lwpd"
          />
          <Field
            name="note"
            label={
              <TranslatedText
                stringId="general.notes.label"
                fallback="Notes"
                data-testid="translatedtext-qh5p"
              />
            }
            component={TextField}
            multiline
            minRows={2}
            data-testid="field-nj3s"
          />
          <Field
            name="recordedDate"
            label={
              <TranslatedText
                stringId="general.recordedDate.label"
                fallback="Date recorded"
                data-testid="translatedtext-fz1o"
              />
            }
            component={DateField}
            saveDateAsString
            required
            data-testid="field-urg2"
          />
          <FormSubmitCancelRow
            onCancel={onCancel}
            onConfirm={submitForm}
            confirmText={
              editedObject ? (
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid="translatedtext-bail"
                />
              ) : (
                <TranslatedText
                  stringId="general.action.add"
                  fallback="Add"
                  data-testid="translatedtext-x6gk"
                />
              )
            }
            data-testid="formsubmitcancelrow-x2a0"
          />
        </NoteModalActionBlocker>
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
        .translatedLabel(
          <TranslatedText
            stringId="general.note.label"
            fallback="Note"
            data-testid="translatedtext-dx2i"
          />,
        ),
      recordedDate: yup
        .date()
        .required()
        .translatedLabel(
          <TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid="translatedtext-kysq"
          />,
        ),
    })}
    data-testid="form-3mvk"
  />
);
