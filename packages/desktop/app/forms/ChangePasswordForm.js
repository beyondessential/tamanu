import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import { FormGrid } from '../components/FormGrid';
import {
  Button,
  Field,
  Form,
  MinusIconButton,
  PlusIconButton,
  TextField,
  StyledPrimarySubmitButton,
} from '../components';
import { ServerDetectingField, getSavedServer } from '../components/Field/ServerDetectingField';

const AdvancedRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  font-size: 16px;
`;

const AdvancedButtonSpan = styled.span`
  .MuiButtonBase-root {
    padding: 0px 0px 0px 9px;
    font-size: 20px;
  }
`;

const SuccessMessage = styled.p`
  margin-top: 0;
`;

export const ChangePasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, email, onNavToLogin, onNavToResetPassword }) => {
    const needsServer = !getSavedServer();
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(needsServer);

    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <h3>Reset Password</h3>
        <div>Please enter the reset code you have received in your email</div>
        <div>{errorMessage}</div>
        <Field name="token" type="text" label="Reset Code" required component={TextField} />
        <Field
          name="newPassword"
          type="password"
          label="Enter a new password"
          required
          component={TextField}
        />
        <AdvancedRow>
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
        </AdvancedRow>
        <Collapse in={isAdvancedExpanded}>
          <Field
            name="host"
            label="LAN server address"
            required
            component={ServerDetectingField}
            setFieldValue={setFieldValue}
          />
        </Collapse>
        <StyledPrimarySubmitButton type="submit">Change Password</StyledPrimarySubmitButton>
        <Button onClick={onNavToResetPassword} color="default" variant="text">
          Back
        </Button>
      </FormGrid>
    );

    if (success) {
      return (
        <FormGrid columns={1}>
          <h3>Reset Password</h3>
          <SuccessMessage>Your password has been updated</SuccessMessage>
          <Button fullWidth variant="contained" color="primary" onClick={onNavToLogin}>
            Login
          </Button>
        </FormGrid>
      );
    }

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          email,
        }}
        validationSchema={yup.object().shape({
          token: yup.string().required(),
          newPassword: yup
            .string()
            .min(5, 'Must be at least 5 characters')
            .required(),
        })}
      />
    );
  },
);
