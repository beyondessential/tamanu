import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

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
        <Field name="recordedDate" label="Date recorded" required component={DateField} />
        <Field name="relationship" label="Relation to patient" component={TextField} />
        <Field
          name="practitionerId"
          label="Doctor/nurse"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} multiline rows={2} />
        <ConfirmCancelRow
          onConfirm={submitForm}
          onCancel={onCancel}
          confirmText={editedObject ? 'Save' : 'Add'}
        />
      </FormGrid>
    )}
    initialValues={{
      recordedDate: new Date(),
      ...editedObject,
    }}
    validationSchema={yup.object().shape({
      diagnosisId: foreignKey('Diagnosis is required'),
      practitionerId: foreignKey('Doctor/nurse is required'),
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
