import React, { memo } from 'react';
import * as yup from 'yup';

import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ModalActionRow';

export const NewUserForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field name="name" label="Name" component={TextField} required />
      <Field name="displayName" label="Display name" component={TextField} required />
      <Field name="password" label="Password" type="password" component={TextField} required />
      <Field name="email" label="Email address" component={TextField} required />
      <ModalActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
        displayName: yup.string().required(),
        password: yup.string().required(),
        email: yup
          .string()
          .email()
          .required(),
      })}
    />
  );
});
