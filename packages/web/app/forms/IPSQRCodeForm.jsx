import React from 'react';
import { Colors } from '../constants/styles';
import * as Yup from 'yup';
import styled from 'styled-components';

import {
  TextField,
  Form,
  FormGrid,
  FormSubmitCancelRow,
} from '@tamanu/ui-components';
import { Field } from '../components/Field';
import { DateOnlyDisplay } from '../components';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { PATIENT_TABS } from '../constants/patientPaths';
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
      <p>
        You will be asked to enter the patient&apos;s date of birth in order to log into the IPS
        portal. Please ensure this is correct otherwise amend in the{' '}
        <StyledPatientDetailsLink
          onClick={() => {
            navigateToPatient(patient.id, { tab: PATIENT_TABS.DETAILS });
            onCancel();
          }}
          data-testid="styledpatientdetailslink-n7g6"
        >
          patient&apos;s details
        </StyledPatientDetailsLink>{' '}
        section.
      </p>
      <StyledDateOfBirthWrapper data-testid="styleddateofbirthwrapper-byuz">
        <StyledDateOfBirthContainer data-testid="styleddateofbirthcontainer-3qce">
          <StyledDateOfBirthText data-testid="styleddateofbirthtext-smlj">
            Date of birth:{' '}
          </StyledDateOfBirthText>
          <DateOnlyDisplay date={patient.dateOfBirth} fontWeight={500} data-testid="datedisplay-bo0s" />
        </StyledDateOfBirthContainer>
      </StyledDateOfBirthWrapper>
      <p>Enter the email address you would like the patient IPS QR code sent to.</p>
      <FormGrid columns={1} data-testid="formgrid-fhz8">
        <Field
          name="email"
          label={
            <TranslatedText
              stringId="patient.email.label"
              fallback="Patient email"
              data-testid="translatedtext-xfxp"
            />
          }
          component={TextField}
          required
          data-testid="field-4vh6"
        />
        <Field
          name="confirmEmail"
          label={
            <TranslatedText
              stringId="patient.confirmEmail.label"
              fallback="Confirm patient email"
              data-testid="translatedtext-pac5"
            />
          }
          component={TextField}
          required
          data-testid="field-sg75"
        />
        <FormSubmitCancelRow
          confirmText={
            <TranslatedText
              stringId="general.action.send"
              fallback="Send"
              data-testid="translatedtext-bsph"
            />
          }
          onConfirm={onSubmit}
          confirmDisabled={confirmDisabled}
          onCancel={onCancel}
          data-testid="formsubmitcancelrow-qcio"
        />
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
          data-testid="ipsqrcodeformcomponent-8ya5"
        />
      )}
      data-testid="form-gqhc"
    />
  );
};
