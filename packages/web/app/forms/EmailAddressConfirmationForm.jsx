import React from 'react';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { useTranslation } from '../contexts/Translation';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const EmailAddressConfirmationForm = React.memo(({ onCancel, onSubmit }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector(state => state.patient);

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{ email: patient.email }}
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
          .nullable()
          .required(),
        confirmEmail: Yup.string()
          .oneOf(
            [Yup.ref('email'), null],
            getTranslation('validation.rule.emailsMatch', 'Emails must match'),
          )
          .required(),
      })}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field
            name="email"
            label={<TranslatedText stringId="patient.email.label" fallback="Patient email" />}
            component={TextField}
            required
          />
          <Field
            name="confirmEmail"
            label={
              <TranslatedText
                stringId="patient.confirmEmail.label"
                fallback="Confirm patient email"
              />
            }
            component={TextField}
            required
          />
          <FormSubmitCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  );
});
