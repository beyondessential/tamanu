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
        name="email"
        label={<TranslatedText stringId="user.emailAddress.label" fallback="Email address" />}
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
        name="role"
        label={<TranslatedText stringId="user.role.label" fallback="Role ID" />}
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
        name="displayId"
        label={<TranslatedText stringId="user.displayId.label" fallback="Display ID" />}
        component={TextField}
      />
      <Field
        name="phoneNumber"
        label={<TranslatedText stringId="user.phoneNumber.label" fallback="Phone number" />}
        component={TextField}
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
        email: yup
          .string()
          .email()
          .required()
          .translatedLabel(
            <TranslatedText stringId="user.emailAddress.label" fallback="Email address" />,
          ),
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
        name: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="user.name.label" fallback="Name" />),
        role: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="user.role.label" fallback="Role ID" />),
        displayId: yup
          .string()
          .translatedLabel(
            <TranslatedText stringId="user.displayId.label" fallback="Display ID" />,
          ),
        phoneNumber: yup
          .string()
          .translatedLabel(
            <TranslatedText stringId="user.phoneNumber.label" fallback="Phone number" />,
          ),
      })}
    />
  );
});
