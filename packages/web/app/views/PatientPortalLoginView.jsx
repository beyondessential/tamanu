import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants';
import { LogoLight } from '../components/Logo';
import { Form, Field, DateField, FormSubmitButton } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useApi } from '../api';
import { LoadingIndicator } from '../components/LoadingIndicator';

const Container = styled.div`
  min-height: 100vh;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: ${Colors.primary};
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px 26px;
  background: ${Colors.white};
  margin-top: 40%;
`;

const Title = styled.h1`
  color: ${Colors.darkestText};
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: ${Colors.midText};
  font-size: 14px;
  margin: 0 0 24px 0;
`;

const StyledField = styled(Field)`
  margin-bottom: 8px;

  .label-field {
    font-size: 14px;
    color: ${Colors.darkestText};
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid ${Colors.border};
    border-radius: 4px;
    font-size: 14px;
    &::placeholder {
      color: ${Colors.lightText};
    }
  }
`;

const LoginButton = styled(FormSubmitButton)`
  background: ${Colors.primary};
  color: ${Colors.white};
  font-size: 16px;
  padding: 12px;
  width: 100%;
  border-radius: 4px;
  text-transform: none;

  &:hover {
    background: ${Colors.primaryDark};
  }
`;

const ErrorText = styled.p`
  color: ${Colors.alert};
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
`;

export const PatientPortalLoginView = () => {
  const { patientId } = useParams();
  const history = useHistory();
  const { getTranslation } = useTranslation();
  const [error, setError] = useState(null);
  const api = useApi();

  const { data: patient, isLoading } = useQuery(
    ['patient-portal', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}`),
  );

  const handleSubmit = async (values) => {
    try {
      if (!patient) {
        setError('Patient not found');
        return;
      }

      // Compare the entered date of birth with the patient's actual date of birth
      const enteredDate = new Date(values.dateOfBirth);
      const patientDate = new Date(patient.dateOfBirth);

      // Compare only the date part (ignore time)
      if (
        enteredDate.getFullYear() === patientDate.getFullYear() &&
        enteredDate.getMonth() === patientDate.getMonth() &&
        enteredDate.getDate() === patientDate.getDate()
      ) {
        history.push(`/patient-portal/${patientId}`);
      } else {
        setError('Invalid date of birth. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <Header>
        <LogoLight height="60" />
      </Header>
      <Content>
        <Title>
          <TranslatedText stringId="patientPortal.login.heading" fallback="Log In" />
        </Title>
        <Subtitle>
          <TranslatedText
            stringId="patientPortal.login.subheading"
            fallback="Enter your date of birth below to log in"
          />
        </Subtitle>

        <Form
          onSubmit={handleSubmit}
          validationSchema={yup.object().shape({
            dateOfBirth: yup
              .date()
              .required(getTranslation('validation.required.inline', '*Required'))
              .max(new Date(), getTranslation('validation.date.future', 'Date cannot be in the future'))
          })}
          initialValues={{
            dateOfBirth: '',
          }}
          render={() => (
            <div>
              <StyledField
                name="dateOfBirth"
                label={<TranslatedText stringId="patientPortal.login.dateOfBirth" fallback="Patient date of birth" />}
                component={DateField}
                placeholder="e.g. 01/01/1980"
                required
              />
              <LoginButton
                text={<TranslatedText stringId="patientPortal.login.submit" fallback="Log in" />}
              />
              {error && <ErrorText>{error}</ErrorText>}
            </div>
          )}
        />
      </Content>
    </Container>
  );
};
