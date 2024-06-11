import * as Yup from 'yup';
import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { ChangePasswordFields } from './ChangePasswordFields';
import { ChangePasswordFormProps } from '/interfaces/forms/ChangePasswordFormProps';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const changePasswordInitialValues = {
  email: '',
  token: '',
  newPassword: '',
  server: '',
};

export const ChangePasswordForm: FunctionComponent<ChangePasswordFormProps> = ({
  onSubmitForm,
  email,
}: ChangePasswordFormProps) => {
  const { getTranslation } = useTranslation();
  return (
    <Form
      initialValues={{ ...changePasswordInitialValues, email }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(),
        token: Yup.string(),
        newPassword: Yup.string().min(
          5,
          getTranslation('validation.rule.min5Characters', 'Must be at least 5 characters'),
        ),
        server: Yup.string(),
      })}
      onSubmit={onSubmitForm}
    >
      {(): ReactElement => <ChangePasswordFields />}
    </Form>
  );
};
