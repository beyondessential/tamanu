import * as Yup from 'yup';
import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { ResetPasswordFields } from './ResetPasswordFields';
import { ResetPasswordFormProps } from '/interfaces/forms/ResetPasswordFormProps';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const resetPasswordInitialValues = {
  email: '',
  server: '',
};

export const ResetPasswordForm: FunctionComponent<ResetPasswordFormProps> = ({
  onSubmitForm,
}: ResetPasswordFormProps) => {
  const { getTranslation } = useTranslation();
  return (
    <Form
      initialValues={resetPasswordInitialValues}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(
          getTranslation('validation.rule.validEmail', 'Must be a valid email address'),
        ),
        server: Yup.string(),
      })}
      onSubmit={onSubmitForm}
    >
      {(): ReactElement => <ResetPasswordFields />}
    </Form>
  );
};
