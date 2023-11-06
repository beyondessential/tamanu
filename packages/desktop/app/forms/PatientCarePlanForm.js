import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { DateTimeField, Form, Field, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';
import { LocalisedText } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
          label={<TranslatedText stringId="carePlan.form.plan.label" fallback="Care plan" />}
          component={AutocompleteField}
          suggester={carePlanSuggester}
          required
        />
        <FormGrid columns={2}>
          <Field
            name="date"
            label={
              <TranslatedText stringId="general.form.recordedDate.label" fallback="Date recorded" />
            }
            component={DateTimeField}
            saveDateAsString
          />
          <Field
            name="examinerId"
            label={<LocalisedText path="fields.clinician.shortLabel" />}
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
        </FormGrid>
        <Field
          name="content"
          label={
            <TranslatedText stringId="carePlan.form.content.label" fallback="Main care plan" />
          }
          required
          component={TextField}
          multiline
          rows={6}
        />
        <ConfirmCancelRow
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
      date: getCurrentDateTimeString(),
      ...editedObject,
    }}
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
