import React from 'react';
import * as Yup from 'yup';
import styled from 'styled-components';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { DateDisplay } from '../components';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { PATIENT_TABS } from '../constants/patientPaths';

const StyledPatientDetailsLink = styled.span`
  cursor: pointer;
  font-weight: bold;
  text-decoration: underline;
`;

const IPSQRCodeFormComponent = ({ patient, onSubmit, onCancel }) => {
  const { navigateToPatient } = usePatientNavigation();

  return (
    <>
      <p>
        You will be asked to enter the patients data of birth in order to log into the IPS portal.
        Please ensure this is correct otherwise amend in the{' '}
        <StyledPatientDetailsLink
          onClick={() => {
            onCancel();
            navigateToPatient(patient.id, { tab: PATIENT_TABS.DETAILS });
          }}
        >
          patients details
        </StyledPatientDetailsLink>{' '}
        section.
      </p>

      <span>Date of birth: </span>
      <DateDisplay date={patient.dateOfBirth} />

      <p>Enter the email address you would like the patient IPS QR code sent to.</p>

      <FormGrid columns={1}>
        <Field name="email" label="Patient email" component={TextField} required />
        <Field name="confirmEmail" label="Confirm patient email" component={TextField} required />
        <FormSubmitCancelRow confirmText="Send" onConfirm={onSubmit} onCancel={onCancel} />
      </FormGrid>
    </>
  );
};

export const IPSQRCodeForm = ({ patient, onSubmit, onCancel }) => (
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
      <IPSQRCodeFormComponent patient={patient} onSubmit={submitForm} onCancel={onCancel} />
    )}
  />
);
