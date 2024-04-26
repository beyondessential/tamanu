import React, { memo } from 'react';
import * as yup from 'yup';

import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { FORM_TYPES } from '../constants';

export const NewUserForm = memo(({ onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field name="email" label="Email address" component={TextField} required />
      <Field name="displayName" label="Display name" component={TextField} required />
      <Field name="role" label="Role ID" component={TextField} required />
      <Field name="password" label="Password" type="password" component={TextField} required />
      <Field name="displayId" label="Display ID" component={TextField} />
      <Field name="phoneNumber" label="Phone number" component={TextField} />
      <ModalFormActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        displayName: yup.string().required(),
        role: yup.string().required(),
        displayId: yup.string(),
        phoneNumber: yup.string(),
        password: yup.string().required(),
        email: yup
          .string()
          .email()
          .required(),
      })}
    />
  );
});
