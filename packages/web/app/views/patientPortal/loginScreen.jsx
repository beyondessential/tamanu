import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../../components/FormGrid';
import { BodyText, Field, Form, FormSubmitButton, LogoLight, TextField } from '../../components';
import { Colors } from '../../constants';
import * as yup from 'yup';
import { useEncounterDataQuery } from '../../api/queries';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { toDateString } from '@tamanu/utils/dateTime';
import { login } from '../../store';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${Colors.white};
`;

const Header = styled.div`
  background: ${Colors.primary};
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoContainer = styled.div`
  width: 200px;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: ${Colors.white};
  padding: 40px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const LoginHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
  text-align: left;
`;

const LoginSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 10px;
  text-align: left;
`;

const LoginButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 15px;
  width: 100%;
`;

const StyledFormGrid = styled(FormGrid)`
  text-align: left;
  width: 100%;
`;

const LoginScreen = () => {
  return (
    <LoginContainer>
      <Header>
        <LogoContainer>
          <LogoLight size="180px" />
        </LogoContainer>
      </Header>
      <ContentContainer>
        <LoginCard>
          <StyledFormGrid columns={1}>
            <div>
              <LoginHeading>Log in</LoginHeading>
              <LoginSubtext>Enter your date of birth to log in</LoginSubtext>
            </div>
            <Field
              name="dateOfBirth"
              label="Patient date of birth"
              type="date"
              required
              component={TextField}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <LoginButton text="Login" />
          </StyledFormGrid>
        </LoginCard>
      </ContentContainer>
    </LoginContainer>
  );
};

export const PatientPortalLoginForm = React.memo(() => {
  const { encounterId } = useParams();

  const { data: encounter } = useEncounterDataQuery(encounterId);
  const { data: patient } = usePatientDataQuery(encounter?.patientId);

  const dispatch = useDispatch();

  return (
    <Form
      onSubmit={async ({ dateOfBirth }) => {
        if (patient?.dateOfBirth === dateOfBirth) {
          // await dispatch(login('admin@tamanu.io', 'admin', true));
          dispatch(push(`/patient-portal/patient/${patient.id}/encounter/${encounterId}`));
        } else {
          console.log('date of birth does not match');
        }
      }}
      render={() => <LoginScreen encounterId={encounterId} />}
      initialValues={{
        dateOfBirth: '',
      }}
      validationSchema={yup.object().shape({
        dateOfBirth: yup
          .date()
          .required('Date of birth is required')
          .max(new Date(), 'Date of birth cannot be in the future')
          .test('match-patient-dob', 'Date of birth does not match our records', function(value) {
            if (!patient?.dateOfBirth) return true; // Skip validation if patient data isn't loaded yet
            return toDateString(value) === patient.dateOfBirth;
          }),
      })}
    />
  );
});
