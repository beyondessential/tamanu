import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, FormSubmitCancelRow } from '@tamanu/ui-components';

import { AutocompleteField, Field, } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const ChangeClinicianForm = ({ clinicianSuggester, onCancel, onSubmit }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1} data-testid="formgrid-5e62">
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
                  data-testid="translatedtext-1ugb"
                />
              ),
            }}
            data-testid="translatedtext-ulea"
          />
        }
        suggester={clinicianSuggester}
        required
        data-testid="field-ygtl"
      />
      <FormSubmitCancelRow
        onConfirm={submitForm}
        confirmText={
          <TranslatedText
            stringId="general.action.save"
            fallback="Save"
            data-testid="translatedtext-49d7"
          />
        }
        onCancel={onCancel}
        data-testid="formsubmitcancelrow-t8lx"
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
              fallback="Clinician"
              data-testid="translatedtext-ylrt"
            />,
          ),
      })}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
      data-testid="form-djtm"
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
