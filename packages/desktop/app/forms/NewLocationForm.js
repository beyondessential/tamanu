import React, { memo, useCallback } from 'react';
import * as yup from 'yup';

import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ModalActionRow';

export const NewLocationForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <Field name="name" label="Location name" component={TextField} required />
        <ModalActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    ),
    [onCancel],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
      })}
    />
  );
});
