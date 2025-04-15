import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import * as yup from 'yup';
import { Colors } from '../constants';
import { LogoLight } from '../components/Logo';
import { Form, Field, DateField, FormSubmitButton } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

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

  const handleSubmit = async (values) => {
    try {
      // TODO: Implement actual login logic here using values.dateOfBirth
      history.push(`/patient-portal/${patientId}`);
    } catch (err) {
      setError('Invalid date of birth. Please try again.');
    }
  };

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
