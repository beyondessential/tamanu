import React from 'react';
import * as Yup from 'yup';
import styled from 'styled-components';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { DateDisplay } from '../components';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { PATIENT_TABS } from '../constants/patientPaths';
import { Colors } from '../constants';

const StyledPatientDetailsLink = styled.span`
  cursor: pointer;
  font-weight: bold;
  text-decoration: underline;
`;

const StyledDateOfBirthWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledDateOfBirthContainer = styled.div`
  padding: 10px 20px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
`;

const StyledDateOfBirthText = styled.span`
  color: ${Colors.darkText};
`;

const IPSQRCodeFormComponent = ({ patient, onSubmit, onCancel }) => {
  const { navigateToPatient } = usePatientNavigation();

  return (
    <>
      <p>
        You will be asked to enter the patient&apos;s data of birth in order to log into the IPS
        portal. Please ensure this is correct otherwise amend in the{' '}
        <StyledPatientDetailsLink
          onClick={() => {
            navigateToPatient(patient.id, { tab: PATIENT_TABS.DETAILS });
            onCancel();
          }}
        >
          patient&apos;s details
        </StyledPatientDetailsLink>{' '}
        section.
      </p>

      <StyledDateOfBirthWrapper>
        <StyledDateOfBirthContainer>
          <StyledDateOfBirthText>Date of birth: </StyledDateOfBirthText>
          <DateDisplay date={patient.dateOfBirth} fontWeight={500} />
        </StyledDateOfBirthContainer>
      </StyledDateOfBirthWrapper>

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
