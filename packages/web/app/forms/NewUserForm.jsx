import React, { memo } from 'react';
import * as yup from 'yup';

import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { FORM_TYPES } from '../constants';

export const NewUserForm = memo(({ onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field name="name" label="Name" component={TextField} required />
      <Field name="displayName" label="Display name" component={TextField} required />
      <Field name="password" label="Password" type="password" component={TextField} required />
      <Field name="email" label="Email address" component={TextField} required />
      <ModalFormActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={FORM_TYPES.CREATE_DATA_FORM}
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
