import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { AutocompleteField, DateTimeField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';
import { LocalisedText } from '../components';
import { FORM_TYPES } from '../constants';

export const PatientCarePlanForm = ({
  practitionerSuggester,
  carePlanSuggester,
  editedObject,
  onCancel,
  onSubmit,
}) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="carePlanId"
          label="Care plan"
          component={AutocompleteField}
          suggester={carePlanSuggester}
          required
        />
        <FormGrid columns={2}>
          <Field name="date" label="Date recorded" component={DateTimeField} saveDateAsString />
          <Field
            name="examinerId"
            label={<LocalisedText path="fields.clinician.shortLabel" />}
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
        </FormGrid>
        <Field
          name="content"
          label="Main care plan"
          required
          component={TextField}
          multiline
          rows={6}
        />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={editedObject ? 'Save' : 'Add'}
        />
      </FormGrid>
    )}
    initialValues={{
      date: getCurrentDateTimeString(),
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      carePlanId: foreignKey('Care plan is a required field'),
      date: yup.date(),
      examinerId: yup.string(),
      content: yup.string(),
    })}
  />
);

PatientCarePlanForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

PatientCarePlanForm.defaultProps = {
  editedObject: null,
};
