import React, { useState } from 'react';
import Collapse from '@material-ui/core/Collapse';
import * as yup from 'yup';
import styled from 'styled-components';
import { LANGUAGE_CODES } from '@tamanu/constants';
import { FormGrid } from '../components/FormGrid';
import {
  Button,
  CheckField,
  Field,
  Form,
  MinusIconButton,
  PlusIconButton,
  TextField,
} from '../components';
import { ServerDetectingField } from '../components/Field/ServerDetectingField';
import { LanguageSelector } from '../components/LanguageSelector';

const LoginButton = styled(Button)`
  font-size: 16px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const RememberMeAdvancedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
`;

const AdvancedButtonSpan = styled.span`
  .MuiButtonBase-root {
    padding: 0px 0px 0px 9px;
    font-size: 20px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
`;

export const LoginForm = React.memo(
  ({ onSubmit, errorMessage, rememberEmail, onNavToResetPassword }) => {
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

    const onError = errors => {
      if (errors.host) {
        setAdvancedExpanded(true);
      }
    };

    const renderForm = ({ setFieldValue, isSubmitting }) => (
      <FormGrid columns={1}>
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <Field name="email" type="email" label="Email" required component={TextField} />
        <Field name="password" label="Password" type="password" required component={TextField} />
        <RememberMeAdvancedRow>
          <Field name="rememberMe" label="Remember me" component={CheckField} />
          <AdvancedButtonSpan>
            Advanced
            {isAdvancedExpanded ? (
              <MinusIconButton
                onClick={() => setAdvancedExpanded(false)}
                styles={{ padding: '0px' }}
              />
            ) : (
              <PlusIconButton onClick={() => setAdvancedExpanded(true)} />
            )}
          </AdvancedButtonSpan>
        </RememberMeAdvancedRow>
        <Collapse in={isAdvancedExpanded}>
          <Field
            name="host"
            label="LAN server address"
            required
            component={ServerDetectingField}
            setFieldValue={setFieldValue}
          />
        </Collapse>
        <LoginButton type="submit" isSubmitting={isSubmitting}>
          Login to your account
        </LoginButton>
        <Button onClick={onNavToResetPassword} color="default" variant="text">
          Forgot your password?
        </Button>
        <LanguageSelector setFieldValue={setFieldValue} />
      </FormGrid>
    );

    return (
      <Form
        onSubmit={onSubmit}
        onError={onError}
        render={renderForm}
        initialValues={{
          email: rememberEmail,
          rememberMe: !!rememberEmail,
        }}
        validationSchema={yup.object().shape({
          host: yup.string().required(),
          email: yup
            .string()
            .email('Must enter a valid email')
            .nullable()
            .required(),
          password: yup.string().required(),
          language: yup.string(),
        })}
      />
    );
  },
);
