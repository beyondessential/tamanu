import React from 'react';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { useEncounter } from '../contexts/Encounter';

export const ChangeDepartmentForm = ({ onCancel, departmentSuggester, onSubmit }) => {
  const { encounter } = useEncounter();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field name="departmentId" component={AutocompleteField} suggester={departmentSuggester} />
      <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        departmentId: encounter.departmentId,
      }}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
