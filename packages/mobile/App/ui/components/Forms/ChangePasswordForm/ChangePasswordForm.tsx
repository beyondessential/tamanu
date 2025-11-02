import * as Yup from 'yup';
import React, { FunctionComponent, ReactElement } from 'react';
import { Form } from '../Form';
import { ChangePasswordFields } from './ChangePasswordFields';
import { ChangePasswordFormProps } from '/interfaces/forms/ChangePasswordFormProps';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { isBcryptHash } from '~/utils/password';

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
        email: Yup.string().email(
          getTranslation('validation.rule.validEmail', 'Must be a valid email address'),
        ),
        token: Yup.string(),
        newPassword: Yup.string()
          .min(5, getTranslation('validation.rule.min5Characters', 'Must be at least 5 characters'))
          .test(
            'password-is-not-hashed',
            getTranslation(
              'validation.password.isHashed',
              'Password must not be start with hashed (.e.g. $2a$1$, $2a$12$, $2b$1$, $2b$12$, $2y$1$, $2y$12$)',
            ),
            function (value) {
              return !isBcryptHash(value);
            },
          ),
        server: Yup.string(),
      })}
      onSubmit={onSubmitForm}
    >
      {(): ReactElement => <ChangePasswordFields />}
    </Form>
  );
};
