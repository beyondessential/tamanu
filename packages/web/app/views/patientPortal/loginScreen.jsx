import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../../components/FormGrid';
import { BodyText, Field, Form, FormSubmitButton, TextField } from '../../components';
import { Colors } from '../../constants';
import * as yup from 'yup';
import { useEncounterDataQuery } from '../../api/queries';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${Colors.background};
`;

const LoginCard = styled.div`
  background: ${Colors.white};
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const LoginHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
  text-align: center;
`;

const LoginSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 10px;
  text-align: center;
`;

const LoginButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 15px;
  width: 100%;
`;

const InfoText = styled(BodyText)`
  color: ${Colors.midText};
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
`;

const LoginScreen = ({ encounterId }) => {
  return (
    <LoginContainer>
      <LoginCard>
        <FormGrid columns={1}>
          <div>
            <LoginHeading>Patient Portal</LoginHeading>
            <LoginSubtext>Enter your date of birth to access your records</LoginSubtext>
            <InfoText>Encounter ID: {encounterId}</InfoText>
          </div>
          <Field
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            required
            component={TextField}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <LoginButton text="Login" />
        </FormGrid>
      </LoginCard>
    </LoginContainer>
  );
};

export const PatientPortalLoginForm = React.memo(({ encounterId }) => {
  const renderForm = () => <LoginScreen encounterId={encounterId} />;
  const { data: encounter } = useEncounterDataQuery(encounterId);
  const { data: patient } = usePatientDataQuery(encounter?.patientId);

  return (
    <Form
      onSubmit={async ({ dateOfBirth }) => {
        if (patient?.dateOfBirth === dateOfBirth) {
          console.log('Success! Logging in as superuser');
        } else {
          console.log('date of birth does not match');
        }
      }}
      render={renderForm}
      initialValues={{
        dateOfBirth: '',
      }}
      validationSchema={yup.object().shape({
        dateOfBirth: yup
          .date()
          .required('Date of birth is required')
          .max(new Date(), 'Date of birth cannot be in the future'),
      })}
    />
  );
});
