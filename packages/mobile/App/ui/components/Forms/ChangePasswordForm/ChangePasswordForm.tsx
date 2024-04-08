import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { ChangePasswordFields } from './ChangePasswordFields';
import { ChangePasswordFormProps } from '/interfaces/forms/ChangePasswordFormProps';
import { changePasswordInitialValues, changePasswordValidationSchema } from './helpers';

export const ChangePasswordForm: FunctionComponent<ChangePasswordFormProps> = ({
  onSubmitForm,
  email,
}: ChangePasswordFormProps) => (
  <Form
    initialValues={{ ...changePasswordInitialValues, email }}
    validationSchema={changePasswordValidationSchema}
    onSubmit={onSubmitForm}
  >
    {(): ReactElement => (
      <ChangePasswordFields />
    )}
  </Form>
);
