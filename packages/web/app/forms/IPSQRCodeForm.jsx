import React from 'react';
import * as Yup from 'yup';
import styled from 'styled-components';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { DateDisplay } from '../components';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { PATIENT_TABS } from '../constants/patientPaths';
import { Colors } from '../constants';
import { useTranslation } from '../contexts/Translation';
import { TranslatedText } from '../components/Translation/TranslatedText';

const StyledPatientDetailsLink = styled.span`
  cursor: pointer;
  font-weight: bold;
  text-decoration: underline;

  &:hover {
    color: ${Colors.primary};
  }
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

const IPSQRCodeFormComponent = ({ patient, onSubmit, confirmDisabled, onCancel }) => {
  const { navigateToPatient } = usePatientNavigation();

  return (
    <>
      <p data-test-id='p-55qd'>
        You will be asked to enter the patient&apos;s date of birth in order to log into the IPS
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
          <DateDisplay
            date={patient.dateOfBirth}
            fontWeight={500}
            data-test-id='datedisplay-n5dv' />
        </StyledDateOfBirthContainer>
      </StyledDateOfBirthWrapper>
      <p data-test-id='p-rrii'>Enter the email address you would like the patient IPS QR code sent to.</p>
      <FormGrid columns={1}>
        <Field
          name="email"
          label={<TranslatedText
            stringId="patient.email.label"
            fallback="Patient email"
            data-test-id='translatedtext-ijk4' />}
          component={TextField}
          required
          data-test-id='field-u9k6' />
        <Field
          name="confirmEmail"
          label={
            <TranslatedText
              stringId="patient.confirmEmail.label"
              fallback="Confirm patient email"
              data-test-id='translatedtext-vz53' />
          }
          component={TextField}
          required
          data-test-id='field-yrzt' />
        <FormSubmitCancelRow
          confirmText={<TranslatedText
            stringId="general.action.send"
            fallback="Send"
            data-test-id='translatedtext-goro' />}
          onConfirm={onSubmit}
          confirmDisabled={confirmDisabled}
          onCancel={onCancel}
          data-test-id='formsubmitcancelrow-8p7r' />
      </FormGrid>
    </>
  );
};

export const IPSQRCodeForm = ({ patient, onSubmit, confirmDisabled, onCancel }) => {
  const { getTranslation } = useTranslation();
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
        <IPSQRCodeFormComponent
          patient={patient}
          onSubmit={submitForm}
          confirmDisabled={confirmDisabled}
          onCancel={onCancel}
        />
      )}
    />
  );
};
