import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { AutocompleteField, DateField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const FamilyHistoryForm = ({
  onCancel,
  icd10Suggester,
  practitionerSuggester,
  editedObject,
  onSubmit,
}) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="diagnosisId"
          label={<TranslatedText stringId="general.diagnosis.label" fallback="Diagnosis" />}
          required
          component={AutocompleteField}
          suggester={icd10Suggester}
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText stringId="general.recordedDate.label" fallback="Date recorded" />
          }
          required
          component={DateField}
          saveDateAsString
        />
        <Field
          name="relationship"
          label={
            <TranslatedText
              stringId="familyHistory.relationship.label"
              fallback="Relationship to patient"
            />
          }
          component={TextField}
        />
        <Field
          name="practitionerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
            />
          }
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="note"
          label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
          component={TextField}
          multiline
          rows={2}
        />
        <FormSubmitCancelRow
          onConfirm={submitForm}
          onCancel={onCancel}
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
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      diagnosisId: foreignKey('Diagnosis is required'),
      practitionerId: optionalForeignKey(),
      recordedDate: yup.date().required(),
    })}
  />
);

FamilyHistoryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

FamilyHistoryForm.defaultProps = {
  editedObject: null,
};
