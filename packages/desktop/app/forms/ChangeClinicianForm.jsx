import PropTypes from 'prop-types';
import React from 'react';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useLocalisedText } from '../components';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { AutocompleteField, Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';

export const ChangeClinicianForm = ({ clinicianSuggester, onCancel, onSubmit }) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="examinerId"
        component={AutocompleteField}
        label={`Search new ${clinicianText.toLowerCase()}`}
        required
        suggester={clinicianSuggester}
      />
      <FormSubmitCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      validationSchema={yup.object().shape({
        examinerId: yup.string().required(`${clinicianText} is required`),
      })}
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
