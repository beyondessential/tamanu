import { ResetPasswordFormProps } from '/interfaces/forms/ResetPasswordFormProps';
import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { resetPasswordInitialValues, resetPasswordValidationSchema } from './helpers';
import { ResetPasswordFields } from './ResetPasswordFields';

export const ResetPasswordForm: FunctionComponent<ResetPasswordFormProps> = ({
  onSubmitForm,
}: ResetPasswordFormProps) => (
  <Form
    initialValues={resetPasswordInitialValues}
    validationSchema={resetPasswordValidationSchema}
    onSubmit={onSubmitForm}
  >
    {({ handleSubmit, isSubmitting }): ReactElement => (
      <ResetPasswordFields handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
    )}
  </Form>
);
