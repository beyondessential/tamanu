import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { AutocompleteField, DateField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';
import { LocalisedText } from '../components';
import { FORM_TYPES } from '../constants';

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
          label="Diagnosis"
          required
          component={AutocompleteField}
          suggester={icd10Suggester}
        />
        <Field
          name="recordedDate"
          label="Date recorded"
          required
          component={DateField}
          saveDateAsString
        />
        <Field name="relationship" label="Relation to patient" component={TextField} />
        <Field
          name="practitionerId"
          label={<LocalisedText path="fields.clinician.shortLabel" />}
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} multiline rows={2} />
        <FormSubmitCancelRow
          onConfirm={submitForm}
          onCancel={onCancel}
          confirmText={editedObject ? 'Save' : 'Add'}
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
