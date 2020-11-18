import React, { FunctionComponent, ReactElement } from 'react';
import { SignInFormProps } from '/interfaces/forms/SignInFormProps';
import { Form } from '../Form';
import { signIninitialValues, signInValidationSchema } from './helpers';
import { SignInFields } from './SignInFields';

export const SignInForm: FunctionComponent<SignInFormProps> = ({
  onSubmitForm,
}: SignInFormProps) => (
  <Form
    initialValues={signIninitialValues}
    validationSchema={signInValidationSchema}
    onSubmit={onSubmitForm}
  >
    {({ handleSubmit, isSubmitting }): ReactElement => (
      <SignInFields handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
    )}
  </Form>
);
