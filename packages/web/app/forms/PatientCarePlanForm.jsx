import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { AutocompleteField, DateTimeField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
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
          label={<TranslatedText
            stringId="carePlan.plan.label"
            fallback="Care plan"
            data-test-id='translatedtext-o14f' />}
          component={AutocompleteField}
          suggester={carePlanSuggester}
          required
          data-test-id='field-rjun' />
        <FormGrid columns={2}>
          <Field
            name="date"
            label={
              <TranslatedText
                stringId="general.recordedDate.label"
                fallback="Date recorded"
                data-test-id='translatedtext-chdx' />
            }
            component={DateTimeField}
            saveDateAsString
            data-test-id='field-nsdf' />
          <Field
            name="examinerId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                data-test-id='translatedtext-ttyy' />
            }
            component={AutocompleteField}
            suggester={practitionerSuggester}
            data-test-id='field-8lmn' />
        </FormGrid>
        <Field
          name="content"
          label={<TranslatedText
            stringId="carePlan.content.label"
            fallback="Main care plan"
            data-test-id='translatedtext-b4xm' />}
          required
          component={TextField}
          multiline
          minRows={6}
          data-test-id='field-tb9e' />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={
            editedObject ? (
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-test-id='translatedtext-qfuk' />
            ) : (
              <TranslatedText
                stringId="general.action.add"
                fallback="Add"
                data-test-id='translatedtext-2y76' />
            )
          }
          data-test-id='formsubmitcancelrow-kuty' />
      </FormGrid>
    )}
    initialValues={{
      date: getCurrentDateTimeString(),
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      carePlanId: foreignKey().translatedLabel(
        <TranslatedText
          stringId="carePlan.plan.label"
          fallback="Care plan"
          data-test-id='translatedtext-bmg9' />,
      ),
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
