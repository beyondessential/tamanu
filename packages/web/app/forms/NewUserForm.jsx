import React, { memo } from 'react';
import * as yup from 'yup';

import { TextField, Form, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { DEVICE_REGISTRATION_PERMISSION } from '@tamanu/constants';
import { Field, SelectField } from '../components/Field';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { TranslatedText } from '../components/Translation/TranslatedText';

const deviceRegistrationPermissionOptions = [
  {
    value: DEVICE_REGISTRATION_PERMISSION.NONE,
    label: <TranslatedText stringId="admin.users.devicePermission.none" fallback="None" />,
  },
  {
    value: DEVICE_REGISTRATION_PERMISSION.SINGLE,
    label: <TranslatedText stringId="admin.users.devicePermission.single" fallback="Single device" />,
  },
  {
    value: DEVICE_REGISTRATION_PERMISSION.UNLIMITED,
    label: <TranslatedText stringId="admin.users.devicePermission.unlimited" fallback="Unlimited" />,
  },
];

export const NewUserForm = memo(({ onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid data-testid="formgrid-n8x9">
      <Field
        name="email"
        label={
          <TranslatedText
            stringId="user.emailAddress.label"
            fallback="Email address"
            data-testid="translatedtext-x7x4"
          />
        }
        component={TextField}
        required
        data-testid="field-u1nw"
      />
      <Field
        name="displayName"
        label={
          <TranslatedText
            stringId="user.displayName.label"
            fallback="Display name"
            data-testid="translatedtext-p88a"
          />
        }
        component={TextField}
        required
        data-testid="field-pmq1"
      />
      <Field
        name="role"
        label={
          <TranslatedText
            stringId="user.role.label"
            fallback="Role ID"
            data-testid="translatedtext-d5b2"
          />
        }
        component={TextField}
        required
        data-testid="field-5da4"
      />
      <Field
        name="password"
        label={
          <TranslatedText
            stringId="login.password.label"
            fallback="Password"
            data-testid="translatedtext-07s3"
          />
        }
        type="password"
        component={TextField}
        required
        data-testid="field-i0dx"
      />
      <Field
        name="displayId"
        label={
          <TranslatedText
            stringId="user.displayId.label"
            fallback="Display ID"
            data-testid="translatedtext-zu1z"
          />
        }
        component={TextField}
        data-testid="field-49a4"
      />
      <Field
        name="phoneNumber"
        label={
          <TranslatedText
            stringId="user.phoneNumber.label"
            fallback="Phone number"
            data-testid="translatedtext-bhom"
          />
        }
        component={TextField}
        data-testid="field-xzdn"
      />
      <Field
        name="deviceRegistrationPermission"
        label={
          <TranslatedText
            stringId="admin.users.deviceRegistrationPermission.label"
            fallback="Device registration"
            data-testid="translatedtext-drp1"
          />
        }
        component={SelectField}
        options={deviceRegistrationPermissionOptions}
        isClearable={false}
        data-testid="field-drp1"
      />
      <ModalFormActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-ucfr"
          />
        }
        onConfirm={submitForm}
        onCancel={onCancel}
        data-testid="modalformactionrow-xpnf"
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
              data-testid="translatedtext-jiu8"
            />,
          ),
        displayName: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="user.displayName.label"
              fallback="Display name"
              data-testid="translatedtext-hdb2"
            />,
          ),
        password: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="login.password.label"
              fallback="Password"
              data-testid="translatedtext-ny9z"
            />,
          ),
        name: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="user.name.label"
              fallback="Name"
              data-testid="translatedtext-y9l8"
            />,
          ),
        role: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="user.role.label"
              fallback="Role ID"
              data-testid="translatedtext-z3g9"
            />,
          ),
        displayId: yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="user.displayId.label"
              fallback="Display ID"
              data-testid="translatedtext-2yxh"
            />,
          ),
        phoneNumber: yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="user.phoneNumber.label"
              fallback="Phone number"
              data-testid="translatedtext-nyyf"
            />,
          ),
        deviceRegistrationPermission: yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="admin.users.deviceRegistrationPermission.label"
              fallback="Device registration"
              data-testid="translatedtext-drpv"
            />,
          ),
      })}
      data-testid="form-4rz4"
    />
  );
});
