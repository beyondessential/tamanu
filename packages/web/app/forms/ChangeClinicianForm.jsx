import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { AutocompleteField, Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const ChangeClinicianForm = ({ clinicianSuggester, onCancel, onSubmit }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="examinerId"
        component={AutocompleteField}
        label={
          <TranslatedText
            stringId="patient.changeClinician.examinerId.label"
            fallback="Search new :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                />
              ),
            }}
          />
        }
        suggester={clinicianSuggester}
        required
      />
      <FormSubmitCancelRow
        onConfirm={submitForm}
        confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
        onCancel={onCancel}
      />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      validationSchema={yup.object().shape({
        examinerId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="clinician"
            />,
          ),
      })}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};

ChangeClinicianForm.propTypes = {
  clinicianSuggester: PropTypes.shape({
    fetchCurrentOption: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
