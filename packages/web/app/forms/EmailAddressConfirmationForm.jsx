import React from 'react';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { useTranslation } from '../contexts/Translation';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const EmailAddressConfirmationForm = React.memo(({ onCancel, onSubmit, emailOverride }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector((state) => state.patient);

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{ email: emailOverride || patient.email }}
      enableReinitialize
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
          .nullable()
          .required(getTranslation('validation.required.inline', '*Required')),
        confirmEmail: Yup.string()
          .oneOf(
            [Yup.ref('email'), null],
            getTranslation('validation.rule.emailsMatch', 'Emails must match'),
          )
          .required(getTranslation('validation.required.inline', '*Required')),
      })}
      suppressErrorDialog
      render={({ submitForm }) => (
        <FormGrid columns={1} data-testid="formgrid-763z">
          <Field
            name="email"
            label={
              <TranslatedText
                stringId="patient.email.label"
                fallback="Patient email"
                data-testid="translatedtext-wrvj"
              />
            }
            component={TextField}
            required
            data-testid="field-lyau"
          />
          <Field
            name="confirmEmail"
            label={
              <TranslatedText
                stringId="patient.confirmEmail.label"
                fallback="Confirm patient email"
                data-testid="translatedtext-jrc0"
              />
            }
            component={TextField}
            required
            data-testid="field-3kaf"
          />
          <FormSubmitCancelRow
            onConfirm={submitForm}
            onCancel={onCancel}
            data-testid="formsubmitcancelrow-un2f"
          />
        </FormGrid>
      )}
      data-testid="form-xx8p"
    />
  );
});
