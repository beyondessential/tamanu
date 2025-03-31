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
        label={<TranslatedText
          stringId="user.emailAddress.label"
          fallback="Email address"
          data-testid='translatedtext-18r4' />}
        component={TextField}
        required
        data-testid='field-mvz2' />
      <Field
        name="displayName"
        label={<TranslatedText
          stringId="user.displayName.label"
          fallback="Display name"
          data-testid='translatedtext-8o5o' />}
        component={TextField}
        required
        data-testid='field-wxmd' />
      <Field
        name="role"
        label={<TranslatedText
          stringId="user.role.label"
          fallback="Role ID"
          data-testid='translatedtext-lu58' />}
        component={TextField}
        required
        data-testid='field-swe1' />
      <Field
        name="password"
        label={<TranslatedText
          stringId="login.password.label"
          fallback="Password"
          data-testid='translatedtext-b3p6' />}
        type="password"
        component={TextField}
        required
        data-testid='field-5wsf' />
      <Field
        name="displayId"
        label={<TranslatedText
          stringId="user.displayId.label"
          fallback="Display ID"
          data-testid='translatedtext-ii07' />}
        component={TextField}
        data-testid='field-aoua' />
      <Field
        name="phoneNumber"
        label={<TranslatedText
          stringId="user.phoneNumber.label"
          fallback="Phone number"
          data-testid='translatedtext-joeo' />}
        component={TextField}
        data-testid='field-0i1i' />
      <ModalFormActionRow
        confirmText={<TranslatedText
          stringId="general.action.confirm"
          fallback="confirm"
          data-testid='translatedtext-z0om' />}
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
            <TranslatedText
              stringId="user.emailAddress.label"
              fallback="Email address"
              data-testid='translatedtext-87mv' />,
          ),
        displayName: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="user.displayName.label"
              fallback="Display name"
              data-testid='translatedtext-ya5s' />,
          ),
        password: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="login.password.label"
          fallback="Password"
          data-testid='translatedtext-ecou' />),
        name: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="user.name.label"
          fallback="Name"
          data-testid='translatedtext-oxfq' />),
        role: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="user.role.label"
          fallback="Role ID"
          data-testid='translatedtext-8fna' />),
        displayId: yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="user.displayId.label"
              fallback="Display ID"
              data-testid='translatedtext-tfww' />,
          ),
        phoneNumber: yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="user.phoneNumber.label"
              fallback="Phone number"
              data-testid='translatedtext-2jvg' />,
          ),
      })}
    />
  );
});
