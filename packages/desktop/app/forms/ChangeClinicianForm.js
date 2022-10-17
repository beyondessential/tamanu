import React from 'react';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export const ChangeClinicianForm = ({ clinicianSuggester, encounter, onCancel, onSubmit }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="examinerId"
        component={AutocompleteField}
        label="Search new clinician"
        required
        suggester={clinicianSuggester}
      />
      <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        clinicianId: encounter.examinerId,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
