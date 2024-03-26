import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { ResetPasswordFields } from './ResetPasswordFields';
import { ResetPasswordFormProps } from '/interfaces/forms/ResetPasswordFormProps';
import { resetPasswordInitialValues, resetPasswordValidationSchema } from './helpers';

export const ResetPasswordForm: FunctionComponent<ResetPasswordFormProps> = ({
  onSubmitForm,
}: ResetPasswordFormProps) => (
  <Form
    initialValues={resetPasswordInitialValues}
    validationSchema={resetPasswordValidationSchema}
    onSubmit={onSubmitForm}
  >
    {(): ReactElement => (
      <ResetPasswordFields />
    )}
  </Form>
);
