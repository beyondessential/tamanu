import React, { useEffect, useState } from 'react';
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
  TextButton,
  TextField,
} from '../components';
import { Colors } from '../constants';

const LoginButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const ForgotPasswordButton = styled(TextButton)`
  font-size: 11px;
  color: black;
  font-weight: 400;

  :hover {
    color: ${Colors.primary};
    font-weight: 500;
    text-decoration: underline;
  }
`;

const RememberMeRow = styled.div`
  display: flex;
  align-items: center;
  justify-self: flex-end;
  justify-content: flex-end;
  font-size: 16px;
  padding-top: 5px;
`;

const ErrorMessage = styled.div`
  text-align: center;
`;

const StyledField = styled(Field)`
  .label-field {
    padding-top: 15px;
  }
`;

const StyledCheckboxField = styled(Field)`
  .MuiFormControlLabel-root {
    margin-right: 0;

    .MuiTypography-root {
      font-size: 11px;
      color: black;
    }

    .MuiButtonBase-root {
      padding: 0 5px;
    }
  }
`;

const LoginFormComponent = ({ errorMessage, onNavToResetPassword, setFieldError }) => {
  const [genericMessage, setGenericMessage] = useState(null);

  useEffect(() => {
    if (errorMessage === USER_DEACTIVATED_ERROR_MESSAGE) {
      setFieldError('email', `*${errorMessage}`);
    } else {
      setGenericMessage(errorMessage);
    }

    // only run this logic when error message is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  return (
    <FormGrid columns={1}>
      {!!genericMessage && <ErrorMessage>{genericMessage}</ErrorMessage>}
      <StyledField
        name="email"
        type="email"
        label="Email"
        required
        component={TextField}
        placeholder="Enter your email address"
      />
      <div>
        <StyledField
          name="password"
          label="Password"
          type="password"
          required
          component={TextField}
          placeholder="Enter your password"
        />
        <RememberMeRow>
          <StyledCheckboxField name="rememberMe" label="Remember me" component={CheckField} />
        </RememberMeRow>
      </div>
      <LoginButton text="Log in" />
      <ForgotPasswordButton onClick={onNavToResetPassword} color="default" variant="text">
        Forgot password?
      </ForgotPasswordButton>
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
