import React, { useEffect, useState } from 'react';
import Collapse from '@material-ui/core/Collapse';
import * as yup from 'yup';
import styled from 'styled-components';

import { USER_DEACTIVATED_ERROR_MESSAGE } from '@tamanu/constants';

import { FormGrid } from '../components/FormGrid';
import {
  Button,
  CheckField,
  Field,
  Form,
  FormSubmitButton,
  MinusIconButton,
  PlusIconButton,
  TextField,
} from '../components';
import { ServerDetectingField } from '../components/Field/ServerDetectingField';

const USER_DEACTIVATED_DISPLAY_MESSAGE =
  'User account deactivated. Please contact your system administrator if assistance is required.';

const LoginButton = styled(FormSubmitButton)`
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

const LoginFormComponent = ({
  errorMessage,
  isAdvancedExpanded,
  setAdvancedExpanded,
  setFieldValue,
  onNavToResetPassword,
  setFieldError,
}) => {
  const [genericMessage, setGenericMessage] = useState(null);

  useEffect(() => {
    if (errorMessage === USER_DEACTIVATED_ERROR_MESSAGE) {
      setFieldError('email', `*${errorMessage}`);
      setGenericMessage(USER_DEACTIVATED_DISPLAY_MESSAGE);
    } else {
      setGenericMessage(errorMessage);
    }

    // only run this logic when error message is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  return (
    <FormGrid columns={1}>
      {!!genericMessage && <ErrorMessage>{genericMessage}</ErrorMessage>}
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
      <LoginButton text="Login to your account" />
      <Button onClick={onNavToResetPassword} color="default" variant="text">
        Forgot your password?
      </Button>
    </FormGrid>
  );
};

export const LoginForm = React.memo(
  ({ onSubmit, errorMessage, rememberEmail, onNavToResetPassword }) => {
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

    const onError = errors => {
      if (errors.host) {
        setAdvancedExpanded(true);
      }
    };

    const renderForm = ({ setFieldValue, setFieldError }) => (
      <LoginFormComponent
        errorMessage={errorMessage}
        isAdvancedExpanded={isAdvancedExpanded}
        setAdvancedExpanded={setAdvancedExpanded}
        setFieldValue={setFieldValue}
        onNavToResetPassword={onNavToResetPassword}
        setFieldError={setFieldError}
      />
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
        })}
      />
    );
  },
);
