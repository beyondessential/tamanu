import React from 'react';
import * as Yup from 'yup';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { usePatient } from '../contexts/Patient';

export const EmailAddressConfirmationForm = React.memo(({ onCancel, onSubmit }) => {
  const { patient } = usePatient();

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{ email: patient.email }}
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .email('Must be a valid email address')
          .required('Email is required'),
        confirmEmail: Yup.string()
          .oneOf([Yup.ref('email'), null], 'Emails must match')
          .required(),
      })}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field name="email" label="Patient Email" component={TextField} required />
          <Field name="confirmEmail" label="Confirm Patient Email" component={TextField} required />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  );
});
