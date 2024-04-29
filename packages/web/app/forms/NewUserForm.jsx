import React, { memo } from 'react';
import * as yup from 'yup';

import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const NewUserForm = memo(({ onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field
        name="name"
        label={<TranslatedText stringId="user.name.label" fallback="Name" />}
        component={TextField}
        required
      />
      <Field
        name="displayName"
        label={<TranslatedText stringId="user.displayName.label" fallback="Display name" />}
        component={TextField}
        required
      />
      <Field
        name="password"
        label={<TranslatedText stringId="login.password.label" fallback="Password" />}
        type="password"
        component={TextField}
        required
      />
      <Field
        name="email"
        label={<TranslatedText stringId="user.emailAddress.label" fallback="Email address" />}
        component={TextField}
        required
      />
      <ModalFormActionRow
        confirmText={<TranslatedText stringId="general.action.confirm" fallback="confirm" />}
        onConfirm={submitForm}
        onCancel={onCancel}
      />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="user.name.label" fallback="Name" />),
        displayName: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="user.displayName.label" fallback="Display name" />,
          ),
        password: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="login.password.label" fallback="Password" />),
        email: yup
          .string()
          .email()
          .required()
          .translatedLabel(
            <TranslatedText stringId="user.emailAddress.label" fallback="Email address" />,
          ),
      })}
    />
  );
});
