import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import { FormGrid } from '../components/FormGrid';
import { Button, Field, Form, MinusIconButton, PlusIconButton, TextField } from '../components';
import { ServerDetectingField, getSavedServer } from '../components/Field/ServerDetectingField';

const PrimaryButton = styled(Button)`
  font-size: 16px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

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

export const ResetPasswordForm = React.memo(
  ({
    onSubmit,
    errorMessage,
    success,
    initialEmail,
    resetPasswordEmail,
    onRestartFlow,
    onNavToChangePassword,
    onNavToLogin,
  }) => {
    const needsServer = !getSavedServer();
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(needsServer);

    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <h3>Reset Password</h3>
        <div>Enter your account email</div>
        <div>{errorMessage}</div>
        <Field name="email" type="email" label="Email" required component={TextField} />
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
        <PrimaryButton type="submit">Reset Password</PrimaryButton>
        <Button onClick={onNavToLogin} color="default" variant="text">
          Back
        </Button>
      </FormGrid>
    );

    if (success) {
      return (
        <FormGrid columns={1}>
          <h3>Reset Password</h3>
          {/* prettier-ignore */}
          <SuccessMessage>
            An email with instructions has been sent to
            {' '}
            <strong>{resetPasswordEmail}</strong>
            . If you do not receive this email within a few minutes please try again.
          </SuccessMessage>
          <PrimaryButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={onNavToChangePassword}
          >
            Continue
          </PrimaryButton>
          <Button onClick={onRestartFlow}>Resend password reset email</Button>
          <Button onClick={onNavToLogin}>Back</Button>
        </FormGrid>
      );
    }

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          email: initialEmail,
        }}
        validationSchema={yup.object().shape({
          host: yup.string().required(),
          email: yup
            .string()
            .email('Must enter a valid email')
            .required(),
        })}
      />
    );
  },
);
