import React, { memo } from 'react';
import * as yup from 'yup';

import { Form, Field, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ButtonRow';

export const SeedRecordsForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => {
    return (
      <FormGrid>
        <Field name="number" label="Number of records" component={NumberField} required />
        <ModalActionRow confirmText="Generate" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        number: yup.number().required(),
      })}
    />
  );
});
