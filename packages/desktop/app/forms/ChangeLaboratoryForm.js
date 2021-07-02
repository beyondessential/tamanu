import React from 'react';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { useSuggester } from '../api/singletons';

export const ChangeLaboratoryForm = ({ onCancel, labRequest, onSubmit }) => {
  const laboratorySuggester = useSuggester('labTestLaboratory');

  const renderForm = ({ submitForm }) => {
    return (
      <FormGrid columns={1}>
        <Field
          name="labTestLaboratoryId"
          label="Laboratory"
          component={AutocompleteField}
          suggester={laboratorySuggester}
        />
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  return (
    <Form
      initialValues={{
        laboratory: labRequest.laboratory,
      }}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
